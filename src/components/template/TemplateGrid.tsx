import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Check, X, Plus, Minus, SplitSquareHorizontal, SplitSquareVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Cell {
  row_index: number;
  col_index: number;
  rowspan: number;
  colspan: number;
  cell_type: string;
  label: string;
  config?: any;
  id?: string;
}

interface TemplateGridProps {
  cells: Cell[];
  setCells: (cells: Cell[]) => void;
  maxRow: number;
  maxCol: number;
  setMaxRow: (val: number) => void;
  setMaxCol: (val: number) => void;
}

export function TemplateGrid({ cells, setCells, maxRow, maxCol, setMaxRow, setMaxCol }: TemplateGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});

  const toggleCheckbox = (cellKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckboxStates(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }));
  };

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

  const handleCellClick = (row: number, col: number) => {
    const cell = getCellAt(row, col);
    if (cell) {
      setEditingCell({ ...cell });
      setEditDialog(true);
    } else {
      setSelectedCell({ row, col });
    }
  };

  const createCell = () => {
    if (!selectedCell) return;
    const newCell: Cell = {
      row_index: selectedCell.row,
      col_index: selectedCell.col,
      rowspan: 1,
      colspan: 1,
      cell_type: "text",
      label: "",
    };
    setCells([...cells, newCell]);
    setSelectedCell(null);
    toast.success("Cell created");
  };

  const deleteCell = (row: number, col: number) => {
    setCells(cells.filter(cell => !(cell.row_index === row && cell.col_index === col)));
    toast.success("Cell deleted");
  };

  const updateCell = () => {
    if (!editingCell) return;
    setCells(
      cells.map((cell) =>
        cell.row_index === editingCell.row_index && cell.col_index === editingCell.col_index
          ? editingCell
          : cell
      )
    );
    setEditDialog(false);
    setEditingCell(null);
    toast.success("Cell updated");
  };

  const splitCellHorizontally = (cell: Cell) => {
    if (cell.colspan < 2) {
      toast.error("Cell must span at least 2 columns to split");
      return;
    }
    
    const newColspan = Math.floor(cell.colspan / 2);
    const updatedCell = { ...cell, colspan: newColspan };
    const newCell = {
      ...cell,
      col_index: cell.col_index + newColspan,
      colspan: cell.colspan - newColspan,
    };
    
    setCells([
      ...cells.filter(c => !(c.row_index === cell.row_index && c.col_index === cell.col_index)),
      updatedCell,
      newCell
    ]);
    setEditDialog(false);
    toast.success("Cell split horizontally");
  };

  const splitCellVertically = (cell: Cell) => {
    if (cell.rowspan < 2) {
      toast.error("Cell must span at least 2 rows to split");
      return;
    }
    
    const newRowspan = Math.floor(cell.rowspan / 2);
    const updatedCell = { ...cell, rowspan: newRowspan };
    const newCell = {
      ...cell,
      row_index: cell.row_index + newRowspan,
      rowspan: cell.rowspan - newRowspan,
    };
    
    setCells([
      ...cells.filter(c => !(c.row_index === cell.row_index && c.col_index === cell.col_index)),
      updatedCell,
      newCell
    ]);
    setEditDialog(false);
    toast.success("Cell split vertically");
  };

  const deleteRow = (rowIndex: number) => {
    setCells(
      cells
        .filter(cell => cell.row_index !== rowIndex)
        .map(cell => ({
          ...cell,
          row_index: cell.row_index > rowIndex ? cell.row_index - 1 : cell.row_index
        }))
    );
    setMaxRow(Math.max(maxRow - 1, 1));
    toast.success("Row deleted");
  };

  const deleteColumn = (colIndex: number) => {
    setCells(
      cells
        .filter(cell => cell.col_index !== colIndex)
        .map(cell => ({
          ...cell,
          col_index: cell.col_index > colIndex ? cell.col_index - 1 : cell.col_index
        }))
    );
    setMaxCol(Math.max(maxCol - 1, 1));
    toast.success("Column deleted");
  };

  const renderGrid = () => {
    const grid: JSX.Element[][] = [];
    
    for (let row = 0; row < maxRow; row++) {
      const rowCells: JSX.Element[] = [];
      
      for (let col = 0; col < maxCol; col++) {
        const cell = getCellAt(row, col);
        
        if (cell && cell.row_index === row && cell.col_index === col) {
          rowCells.push(
            <td
              key={`${row}-${col}`}
              rowSpan={cell.rowspan}
              colSpan={cell.colspan}
              className={`border border-border p-2 cursor-pointer hover:bg-accent/50 relative group ${
                cell.cell_type === "header" ? "bg-muted font-semibold" :
                cell.cell_type === "checkbox" ? "bg-primary/10 text-center" :
                cell.cell_type === "static" ? "bg-card" : ""
              }`}
              onClick={() => handleCellClick(row, col)}
            >
              <div className="flex items-center justify-between gap-2 h-full">
                {cell.cell_type === "checkbox" ? (
                  <button
                    onClick={(e) => toggleCheckbox(`${row}-${col}`, e)}
                    className={cn(
                      "w-full h-full min-h-[60px] rounded-md flex items-center justify-center transition-all hover:scale-105 active:scale-95",
                      checkboxStates[`${row}-${col}`]
                        ? "bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive"
                        : "bg-success/20 hover:bg-success/30 border-2 border-success"
                    )}
                  >
                    {checkboxStates[`${row}-${col}`] ? (
                      <X className="h-8 w-8 text-destructive stroke-[3]" />
                    ) : (
                      <Check className="h-8 w-8 text-success stroke-[3]" />
                    )}
                  </button>
                ) : cell.cell_type === "submit" ? (
                  <Button className="w-full h-full min-h-[48px]" size="lg">
                    {cell.label || "Submit"}
                  </Button>
                ) : cell.cell_type === "textarea" ? (
                  <div className="w-full h-full min-h-[80px] border-2 border-dashed border-muted-foreground/30 rounded-md p-2 bg-muted/20">
                    <span className="text-xs text-muted-foreground">Text area</span>
                  </div>
                ) : (
                  <span className="text-sm">
                    {cell.label || `${cell.cell_type}`}
                  </span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-1 right-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCell(row, col);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </td>
          );
        } else if (!isCellOccupied(row, col)) {
          rowCells.push(
            <td
              key={`${row}-${col}`}
              className={`border border-dashed border-muted-foreground/20 p-2 cursor-pointer hover:bg-primary/5 ${
                selectedCell?.row === row && selectedCell?.col === col ? "bg-primary/10" : ""
              }`}
              onClick={() => handleCellClick(row, col)}
            >
              <div className="h-8 flex items-center justify-center text-muted-foreground/50 text-xs">
                {selectedCell?.row === row && selectedCell?.col === col ? "Click to create" : ""}
              </div>
            </td>
          );
        }
      }
      
      grid.push([
        <tr key={row}>
          <td className="border-r border-border p-1 bg-muted/50 sticky left-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => deleteRow(row)}
            >
              <Minus className="h-3 w-3" />
            </Button>
          </td>
          {rowCells}
        </tr>
      ]);
    }
    
    return grid.flat();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-auto border rounded-lg bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-r border-b border-border p-2 bg-muted sticky left-0"></th>
              {Array.from({ length: maxCol }).map((_, col) => (
                <th key={col} className="border border-border p-2 bg-muted">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => deleteColumn(col)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderGrid()}</tbody>
        </table>
      </div>

      {selectedCell && (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-card">
          <span className="text-sm">
            Selected: Row {selectedCell.row + 1}, Column {selectedCell.col + 1}
          </span>
          <Button onClick={createCell} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Cell
          </Button>
          <Button onClick={() => setSelectedCell(null)} size="sm" variant="outline">
            Cancel
          </Button>
        </div>
      )}

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Cell</DialogTitle>
          </DialogHeader>
          {editingCell && (
            <div className="space-y-4">
              <div>
                <Label>Cell Type</Label>
                <Select
                  value={editingCell.cell_type}
                  onValueChange={(value) =>
                    setEditingCell({ ...editingCell, cell_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="static">Static Text</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="submit">Submit Button</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Label / Content</Label>
                <Input
                  value={editingCell.label}
                  onChange={(e) =>
                    setEditingCell({ ...editingCell, label: e.target.value })
                  }
                  placeholder="Enter cell content"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Row Span</Label>
                  <Input
                    type="number"
                    min="1"
                    max={maxRow}
                    value={editingCell.rowspan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingCell({
                        ...editingCell,
                        rowspan: val === '' ? 1 : Math.max(1, Math.min(parseInt(val) || 1, maxRow)),
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div>
                  <Label>Column Span</Label>
                  <Input
                    type="number"
                    min="1"
                    max={maxCol}
                    value={editingCell.colspan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingCell({
                        ...editingCell,
                        colspan: val === '' ? 1 : Math.max(1, Math.min(parseInt(val) || 1, maxCol)),
                      });
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => splitCellHorizontally(editingCell)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <SplitSquareVertical className="h-4 w-4 mr-2" />
                  Split Horizontal
                </Button>
                <Button
                  onClick={() => splitCellVertically(editingCell)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                  Split Vertical
                </Button>
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={() => setEditDialog(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={updateCell}>
                  <Check className="h-4 w-4 mr-2" />
                  Update Cell
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
