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
  
  // Identify template structure
  const headerCells = cells.filter(c => c.cell_type === "header");
  const checkboxCells = cells.filter(c => c.cell_type === "checkbox");
  const textCells = cells.filter(c => c.cell_type === "text" || c.cell_type === "static");
  
  // Determine data row start (after headers)
  const headerRows = headerCells.length > 0 
    ? Math.max(...headerCells.map(c => c.row_index + c.rowspan))
    : 1;
  
  // Calculate grid dimensions - add rows for each student
  const maxCol = Math.max(...cells.map(c => c.col_index + c.colspan), 1);
  const totalRows = headerRows + students.length;

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

  const renderCell = (cell: Cell, row: number, col: number, studentIndex?: number) => {
    const cellClasses = cn(
      "border border-border p-3 min-h-[60px]",
      cell.cell_type === "header" && "bg-muted font-semibold text-center",
      cell.cell_type === "static" && "bg-card",
      cell.cell_type === "checkbox" && "bg-background"
    );
    
    const cellStyle = cell.config?.backgroundColor 
      ? { 
          backgroundColor: cell.config.backgroundColor,
          opacity: cell.config?.backgroundOpacity || 1
        } 
      : {};

    // Render checkbox cells with student data
    if (cell.cell_type === "checkbox" && studentIndex !== undefined) {
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
            style={cellStyle}
          >
            <div className="flex items-center justify-center h-full p-2">
              <button
                type="button"
                onClick={() => onToggle(student.id)}
                className={cn(
                  "w-full h-full min-h-[60px] rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm",
                  isPresent
                    ? "bg-green-50 hover:bg-green-100 border-2 border-green-500 dark:bg-green-950 dark:hover:bg-green-900"
                    : "bg-red-50 hover:bg-red-100 border-2 border-red-500 dark:bg-red-950 dark:hover:bg-red-900"
                )}
                aria-label={isPresent ? "Mark as absent" : "Mark as present"}
              >
                {isPresent ? (
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" strokeWidth={3} />
                ) : (
                  <X className="h-8 w-8 text-red-600 dark:text-red-400" strokeWidth={3} />
                )}
              </button>
            </div>
          </td>
        );
      }
    }
    
    // Render text cells with student data
    if (cell.cell_type === "text" && studentIndex !== undefined) {
      const student = students[studentIndex];
      if (student) {
        return (
          <td
            key={`${row}-${col}`}
            rowSpan={cell.rowspan}
            colSpan={cell.colspan}
            className={cellClasses}
            style={cellStyle}
          >
            <div className="text-sm">
              {cell.label === "Roll Number" ? student.roll_number : 
               cell.label === "Student Name" ? student.name : 
               cell.label || ""}
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
          style={cellStyle}
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
          style={cellStyle}
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
        style={cellStyle}
      >
        <div className="text-sm">
          {cell.label || (cell.cell_type === "text" ? "" : cell.cell_type)}
        </div>
      </td>
    );
  };

  const renderGrid = () => {
    const grid: JSX.Element[][] = [];
    
    // Render header rows
    for (let row = 0; row < headerRows; row++) {
      const rowCells: JSX.Element[] = [];
      
      for (let col = 0; col < maxCol; col++) {
        const cell = getCellAt(row, col);
        
        if (cell && cell.row_index === row && cell.col_index === col) {
          rowCells.push(renderCell(cell, row, col));
        } else if (!isCellOccupied(row, col)) {
          rowCells.push(
            <td
              key={`${row}-${col}`}
              className="border border-border p-3 min-h-[60px] bg-muted"
            />
          );
        }
      }
      
      if (rowCells.length > 0) {
        grid.push([<tr key={row}>{rowCells}</tr>]);
      }
    }
    
    // Render data rows for each student
    students.forEach((student, studentIndex) => {
      const row = headerRows + studentIndex;
      const rowCells: JSX.Element[] = [];
      
      for (let col = 0; col < maxCol; col++) {
        // Find template cell at this column (use first data row as template)
        const templateCell = cells.find(c => 
          c.col_index === col && 
          c.row_index === headerRows &&
          (c.cell_type === "checkbox" || c.cell_type === "text" || c.cell_type === "textarea")
        );
        
        if (templateCell) {
          rowCells.push(renderCell(templateCell, row, col, studentIndex));
        } else {
          // Check if this column has any template guidance
          const anyColumnCell = cells.find(c => c.col_index === col);
          if (anyColumnCell) {
            rowCells.push(
              <td
                key={`${row}-${col}`}
                className="border border-border p-3 min-h-[60px]"
              >
                <div className="text-sm text-muted-foreground">-</div>
              </td>
            );
          }
        }
      }
      
      if (rowCells.length > 0) {
        grid.push([<tr key={row}>{rowCells}</tr>]);
      }
    });
    
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
