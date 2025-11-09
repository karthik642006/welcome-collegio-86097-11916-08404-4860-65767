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
    const isHeaderRow = row < headerRows;
    const cellClasses = cn(
      "p-4",
      isHeaderRow ? "bg-muted/50 font-semibold text-left border-t" : "border-t",
      cell.cell_type === "header" && "text-center",
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
            key={`${row}-${col}-${student.id}`}
            rowSpan={cell.rowspan}
            colSpan={cell.colspan}
            className="p-4 border-t"
            style={cellStyle}
          >
            <div className="flex items-center justify-center">
              <button
                type="button"
                data-student-id={student.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(student.id);
                }}
                className={cn(
                  "min-h-[60px] min-w-[80px] rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm",
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
            key={`${row}-${col}-${student.id}`}
            rowSpan={cell.rowspan}
            colSpan={cell.colspan}
            className={cellClasses}
            style={cellStyle}
          >
            {cell.label === "Roll Number" ? student.roll_number : 
             cell.label === "Student Name" ? student.name : 
             cell.label || ""}
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
    const rows: JSX.Element[] = [];

    // Render header rows
    for (let row = 0; row < headerRows; row++) {
      const rowCells: JSX.Element[] = [];
      for (let col = 0; col < maxCol; col++) {
        const cell = getCellAt(row, col);
        if (cell && cell.row_index === row && cell.col_index === col) {
          rowCells.push(renderCell(cell, row, col));
        } else if (!isCellOccupied(row, col)) {
          // This ensures we don't leave empty holes in the grid
          rowCells.push(<td key={`${row}-${col}`} className="p-4 border-t" />);
        }
      }
      if (rowCells.length > 0) {
        rows.push(<tr key={`header-${row}`}>{rowCells}</tr>);
      }
    }

    // Identify the structure of data rows from the template
    const dataCells = cells.filter(c => c.row_index >= headerRows);
    const dataRowIndices = [...new Set(dataCells.map(c => c.row_index))].sort((a, b) => a - b);
    const numDataRowsInTemplate = dataRowIndices.length;

    if (numDataRowsInTemplate === 0) return rows; // No data rows to render

    // Render data rows for each student, replicating the template's data section
    students.forEach((_, studentIndex) => {
      dataRowIndices.forEach((templateRowIndex, i) => {
        const currentRow = headerRows + studentIndex * numDataRowsInTemplate + i;
        const rowCells: JSX.Element[] = [];

        for (let col = 0; col < maxCol; col++) {
          // Find the corresponding cell in the template's data section
          const templateCell = getCellAt(templateRowIndex, col);

          if (templateCell && templateCell.row_index === templateRowIndex && templateCell.col_index === col) {
            rowCells.push(renderCell(templateCell, currentRow, col, studentIndex));
          } else if (!isCellOccupied(templateRowIndex, col)) {
            rowCells.push(<td key={`${currentRow}-${col}`} className="p-4 border-t" />);
          }
        }

        if (rowCells.length > 0) {
          rows.push(
            <tr key={`student-${studentIndex}-row-${i}`} className="hover:bg-muted/20 transition-colors">
              {rowCells}
            </tr>
          );
        }
      });
    });

    return rows;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>{renderGrid()}</tbody>
      </table>
    </div>
  );
}
