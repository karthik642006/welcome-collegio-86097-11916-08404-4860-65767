import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  roll_number: string;
  name: string;
  email: string | null;
};

type AttendanceRecord = {
  id?: string;
  student_id: string;
  status: "present" | "absent";
};

type Cell = {
  id: string;
  row_index: number;
  col_index: number;
  rowspan: number;
  colspan: number;
  cell_type: string;
  label: string;
  config?: any;
};

type Template = {
  id: string;
  name: string;
  template_cells: Cell[];
};

interface TemplateAttendanceViewProps {
  template: Template;
  students: Student[];
  attendance: Map<string, AttendanceRecord>;
  onToggle: (studentId: string) => void;
}

export function TemplateAttendanceView({
  template,
  students,
  attendance,
  onToggle,
}: TemplateAttendanceViewProps) {
  const cells = template.template_cells || [];
  
  // Calculate grid dimensions
  const maxRow = Math.max(...cells.map(c => c.row_index + c.rowspan), 1);
  const maxCol = Math.max(...cells.map(c => c.col_index + c.colspan), 1);

  const getCellAt = (row: number, col: number): Cell | null => {
    return cells.find(
      (cell) =>
        row >= cell.row_index &&
        row < cell.row_index + cell.rowspan &&
        col >= cell.col_index &&
        col < cell.col_index + cell.colspan
    ) || null;
  };

  const isCellOccupied = (row: number, col: number): boolean => {
    return cells.some(
      (cell) =>
        row >= cell.row_index &&
        row < cell.row_index + cell.rowspan &&
        col >= cell.col_index &&
        col < cell.col_index + cell.colspan
    );
  };

  const renderCell = (cell: Cell, row: number, col: number) => {
    const cellClasses = cn(
      "border border-border p-3 min-h-[60px]",
      cell.cell_type === "header" && "bg-muted font-semibold text-center",
      cell.cell_type === "static" && "bg-card",
      cell.cell_type === "checkbox" && "bg-background"
    );

    if (cell.cell_type === "checkbox") {
      // For checkbox cells, show toggleable attendance
      const studentIndex = row - 1; // Assuming first row is header
      const student = students[studentIndex];
      
      if (student) {
        const status = attendance.get(student.id)?.status;
        const isPresent = status === "present";

        return (
          <td
            key={`${row}-${col}`}
            rowSpan={cell.rowspan}
            colSpan={cell.colspan}
            className={cellClasses}
          >
            <div className="flex items-center justify-center h-full">
              <button
                onClick={() => onToggle(student.id)}
                className={cn(
                  "w-full h-full min-h-[48px] rounded-md flex items-center justify-center transition-all hover:scale-105 active:scale-95",
                  isPresent
                    ? "bg-success/20 hover:bg-success/30 border-2 border-success"
                    : "bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive"
                )}
              >
                {isPresent ? (
                  <Check className="h-8 w-8 text-success stroke-[3]" />
                ) : (
                  <X className="h-8 w-8 text-destructive stroke-[3]" />
                )}
              </button>
            </div>
          </td>
        );
      }
    }

    if (cell.cell_type === "submit") {
      return (
        <td
          key={`${row}-${col}`}
          rowSpan={cell.rowspan}
          colSpan={cell.colspan}
          className={cellClasses}
        >
          <div className="flex items-center justify-center h-full p-2">
            <button
              onClick={() => {/* Handle submit */}}
              className="w-full h-full min-h-[48px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold transition-all hover:scale-105 active:scale-95"
            >
              {cell.label || "Submit"}
            </button>
          </div>
        </td>
      );
    }

    if (cell.cell_type === "textarea") {
      return (
        <td
          key={`${row}-${col}`}
          rowSpan={cell.rowspan}
          colSpan={cell.colspan}
          className={cellClasses}
        >
          <textarea
            placeholder={cell.label || "Enter text..."}
            className="w-full h-full min-h-[80px] p-2 bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </td>
      );
    }

    return (
      <td
        key={`${row}-${col}`}
        rowSpan={cell.rowspan}
        colSpan={cell.colspan}
        className={cellClasses}
      >
        <div className="text-sm">
          {cell.label || (cell.cell_type === "text" ? "" : cell.cell_type)}
        </div>
      </td>
    );
  };

  const renderGrid = () => {
    const grid: JSX.Element[][] = [];
    
    for (let row = 0; row < maxRow; row++) {
      const rowCells: JSX.Element[] = [];
      
      for (let col = 0; col < maxCol; col++) {
        const cell = getCellAt(row, col);
        
        if (cell && cell.row_index === row && cell.col_index === col) {
          rowCells.push(renderCell(cell, row, col));
        } else if (!isCellOccupied(row, col)) {
          rowCells.push(
            <td
              key={`${row}-${col}`}
              className="border border-dashed border-muted-foreground/20 p-3 min-h-[60px]"
            >
              <div className="text-muted-foreground/50 text-xs text-center">-</div>
            </td>
          );
        }
      }
      
      grid.push([<tr key={row}>{rowCells}</tr>]);
    }
    
    return grid.flat();
  };

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <tbody>{renderGrid()}</tbody>
      </table>
    </div>
  );
}
