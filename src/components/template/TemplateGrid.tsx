import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});
  const [serialDataFormula, setSerialDataFormula] = useState({
    startRow: 0,
    startCol: 0,
    endRow: 0,
    endCol: 0,
    startNumber: "",
    endNumber: ""
  });

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

  const handleCellClick = (row: number, col: number, e?: React.MouseEvent) => {
    const cell = getCellAt(row, col);
    
    if (isMultiSelectMode) {
      // Multi-select mode
      if (!cell) {
        const isSelected = selectedCells.some(c => c.row === row && c.col === col);
        if (isSelected) {
          setSelectedCells(selectedCells.filter(c => !(c.row === row && c.col === col)));
        } else {
          setSelectedCells([...selectedCells, { row, col }]);
        }
      }
    } else {
      // Normal mode
      if (cell) {
        setEditingCell({ ...cell });
        setEditDialog(true);
      } else {
        setSelectedCell({ row, col });
      }
    }
  };

  const getColumnLetter = (col: number): string => {
    let letter = '';
    let num = col;
    while (num >= 0) {
      letter = String.fromCharCode(65 + (num % 26)) + letter;
      num = Math.floor(num / 26) - 1;
    }
    return letter;
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

  const createMultipleCells = () => {
    if (selectedCells.length === 0) return;
    
    const newCells = selectedCells.map(pos => ({
      row_index: pos.row,
      col_index: pos.col,
      rowspan: 1,
      colspan: 1,
      cell_type: "text",
      label: "",
    }));
    
    setCells([...cells, ...newCells]);
    setSelectedCells([]);
    setIsMultiSelectMode(false);
    toast.success(`Created ${newCells.length} cells`);
  };

  const updateMultipleCells = (updates: Partial<Cell>) => {
    if (selectedCells.length === 0) return;
    
    const updatedCells = cells.map(cell => {
      const isSelected = selectedCells.some(
        s => s.row === cell.row_index && s.col === cell.col_index
      );
      return isSelected ? { ...cell, ...updates } : cell;
    });
    
    setCells(updatedCells);
    setSelectedCells([]);
    setIsMultiSelectMode(false);
    toast.success(`Updated ${selectedCells.length} cells`);
  };

  const applySerialDataFormula = () => {
    const { startRow, startCol, endRow, endCol, startNumber, endNumber } = serialDataFormula;
    
    if (!startNumber || !endNumber) {
      toast.error("Please enter start and end numbers");
      return;
    }

    const startNum = parseInt(startNumber);
    const endNum = parseInt(endNumber);
    
    if (isNaN(startNum) || isNaN(endNum)) {
      toast.error("Invalid numbers");
      return;
    }

    const totalCells = (endRow - startRow + 1) * (endCol - startCol + 1);
    const step = (endNum - startNum) / (totalCells - 1);
    
    let currentNum = startNum;
    const newCells: Cell[] = [];
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (!isCellOccupied(row, col)) {
          newCells.push({
            row_index: row,
            col_index: col,
            rowspan: 1,
            colspan: 1,
            cell_type: "static",
            label: Math.round(currentNum).toString(),
          });
        }
        currentNum += step;
      }
    }
    
    setCells([...cells, ...newCells]);
    setSerialDataFormula({
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 0,
      startNumber: "",
      endNumber: ""
    });
    toast.success(`Created ${newCells.length} cells with serial data`);
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
              style={cell.config?.backgroundColor ? { 
                backgroundColor: cell.config.backgroundColor,
                opacity: cell.config?.backgroundOpacity || 1
              } : {}}
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
              } ${
                selectedCells.some(c => c.row === row && c.col === col) ? "bg-blue-200 dark:bg-blue-900" : ""
              }`}
              onClick={(e) => handleCellClick(row, col, e)}
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
          <td className="border-r border-border p-2 bg-muted/50 sticky left-0 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold">{row + 1}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => deleteRow(row)}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
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
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-semibold">{getColumnLetter(col)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={() => deleteColumn(col)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderGrid()}</tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 p-4 border rounded-lg bg-card">
        <Button 
          onClick={() => {
            setIsMultiSelectMode(!isMultiSelectMode);
            setSelectedCells([]);
            setSelectedCell(null);
          }}
          variant={isMultiSelectMode ? "default" : "outline"}
          size="sm"
        >
          {isMultiSelectMode ? "Exit Multi-Select" : "Multi-Select Mode"}
        </Button>
        {isMultiSelectMode && selectedCells.length > 0 && (
          <>
            <span className="text-sm">
              Selected {selectedCells.length} cells
            </span>
            <Button onClick={createMultipleCells} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Cells
            </Button>
            <Button 
              onClick={() => {
                if (selectedCells.length > 0) {
                  // Get first selected cell that exists
                  const firstCell = cells.find(c => 
                    selectedCells.some(s => s.row === c.row_index && s.col === c.col_index)
                  );
                  if (firstCell) {
                    setEditingCell({ ...firstCell });
                    setEditDialog(true);
                  }
                }
              }} 
              size="sm"
              variant="secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Selected
            </Button>
            <Button onClick={() => setSelectedCells([])} size="sm" variant="outline">
              Clear Selection
            </Button>
          </>
        )}
      </div>

      {selectedCell && !isMultiSelectMode && (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-card">
          <span className="text-sm">
            Selected: Row {selectedCell.row + 1}, Column {getColumnLetter(selectedCell.col)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCells.length > 0 ? `Edit ${selectedCells.length} Selected Cells` : "Edit Cell"}
            </DialogTitle>
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

              <div>
                <Label>Cell Background Color</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md mb-3">
                  {[
                    { name: "Default", value: "" },
                    { name: "Red", value: "#fee" },
                    { name: "Green", value: "#efe" },
                    { name: "Blue", value: "#eef" },
                    { name: "Yellow", value: "#ffe" },
                    { name: "Purple", value: "#fef" },
                    { name: "Orange", value: "#fed" },
                    { name: "Pink", value: "#fdd" },
                    { name: "Gray", value: "#eee" },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setEditingCell({
                          ...editingCell,
                          config: { 
                            ...editingCell.config, 
                            backgroundColor: color.value,
                            backgroundOpacity: editingCell.config?.backgroundOpacity || 1
                          },
                        })
                      }
                      className={cn(
                        "w-16 h-10 rounded-md border-2 transition-all hover:scale-105 flex items-center justify-center text-xs font-medium",
                        editingCell.config?.backgroundColor === color.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      )}
                      style={{ backgroundColor: color.value || "#fff" }}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
                {editingCell.config?.backgroundColor && (
                  <div>
                    <Label className="mb-2 flex items-center justify-between">
                      <span>Opacity</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((editingCell.config?.backgroundOpacity || 1) * 100)}%
                      </span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editingCell.config?.backgroundOpacity || 1}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          config: {
                            ...editingCell.config,
                            backgroundOpacity: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}
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

              {/* Serial Data Formula */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-3 block">Serial Data Fill</Label>
                <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Start Row</Label>
                      <Input
                        type="number"
                        min="0"
                        value={serialDataFormula.startRow}
                        onChange={(e) => setSerialDataFormula({
                          ...serialDataFormula,
                          startRow: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Start Column</Label>
                      <Input
                        type="number"
                        min="0"
                        value={serialDataFormula.startCol}
                        onChange={(e) => setSerialDataFormula({
                          ...serialDataFormula,
                          startCol: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Row</Label>
                      <Input
                        type="number"
                        min="0"
                        value={serialDataFormula.endRow}
                        onChange={(e) => setSerialDataFormula({
                          ...serialDataFormula,
                          endRow: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Column</Label>
                      <Input
                        type="number"
                        min="0"
                        value={serialDataFormula.endCol}
                        onChange={(e) => setSerialDataFormula({
                          ...serialDataFormula,
                          endCol: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Start Number</Label>
                      <Input
                        value={serialDataFormula.startNumber}
                        onChange={(e) => setSerialDataFormula({
                          ...serialDataFormula,
                          startNumber: e.target.value
                        })}
                        placeholder="611823104001"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Number</Label>
                      <Input
                        value={serialDataFormula.endNumber}
                        onChange={(e) => setSerialDataFormula({
                          ...serialDataFormula,
                          endNumber: e.target.value
                        })}
                        placeholder="611823204050"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={applySerialDataFormula}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Apply Serial Data
                  </Button>
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
                {selectedCells.length > 0 ? (
                  <Button onClick={() => updateMultipleCells({
                    cell_type: editingCell.cell_type,
                    label: editingCell.label,
                    config: editingCell.config
                  })}>
                    <Check className="h-4 w-4 mr-2" />
                    Update All Selected ({selectedCells.length})
                  </Button>
                ) : (
                  <Button onClick={updateCell}>
                    <Check className="h-4 w-4 mr-2" />
                    Update Cell
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
