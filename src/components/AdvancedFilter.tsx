import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValue {
  field: string;
  operator: string;
  value: string;
}

interface AdvancedFilterProps {
  fields: FilterField[];
  onFilterChange: (filters: FilterValue[]) => void;
  onSearch?: (searchTerm: string) => void;
  searchPlaceholder?: string;
}

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
  ],
  select: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
  ],
  date: [
    { value: 'equals', label: 'On' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater', label: 'Greater than' },
    { value: 'less', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
};

export function AdvancedFilter({ 
  fields, 
  onFilterChange, 
  onSearch,
  searchPlaceholder = "Search..." 
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const addFilter = () => {
    const newFilter: FilterValue = {
      field: fields[0]?.key || '',
      operator: 'equals',
      value: ''
    };
    const updated = [...filters, newFilter];
    setFilters(updated);
  };

  const removeFilter = (index: number) => {
    const updated = filters.filter((_, i) => i !== index);
    setFilters(updated);
    onFilterChange(updated);
  };

  const updateFilter = (index: number, key: keyof FilterValue, value: string) => {
    const updated = filters.map((filter, i) => {
      if (i === index) {
        return { ...filter, [key]: value };
      }
      return filter;
    });
    setFilters(updated);
  };

  const applyFilters = () => {
    onFilterChange(filters.filter(f => f.value));
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters([]);
    onFilterChange([]);
    setSearchTerm("");
    if (onSearch) onSearch("");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const getFieldType = (fieldKey: string): FilterField['type'] => {
    return fields.find(f => f.key === fieldKey)?.type || 'text';
  };

  const activeFilterCount = filters.filter(f => f.value).length;

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      {onSearch && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative touch-target-sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center p-0">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] md:w-[500px] p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter Criteria</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={filters.length === 0}
              >
                Clear All
              </Button>
            </div>

            <Separator />

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filters.map((filter, index) => {
                const fieldType = getFieldType(filter.field);
                const field = fields.find(f => f.key === filter.field);
                
                return (
                  <Card key={index} className="p-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground">Filter {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Field</Label>
                        <Select
                          value={filter.field}
                          onValueChange={(value) => updateFilter(index, 'field', value)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Operator</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, 'operator', value)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS[fieldType].map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        {fieldType === 'select' && field?.options ? (
                          <Select
                            value={filter.value}
                            onValueChange={(value) => updateFilter(index, 'value', value)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            placeholder={field?.placeholder || "Enter value..."}
                            className="h-9 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {filters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No filters added yet. Click "Add Filter" to get started.
                </div>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addFilter}
                className="flex-1 touch-target-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Filter
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                className="flex-1 touch-target-sm"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="touch-target-sm"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
