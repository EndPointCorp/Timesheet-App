import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import TimeRow, { TimeSelectionRow } from "./TimeRow";
import type { WorkChartKind } from "../../types";

export interface TimeRowsProps {
  rows: Array<TimeSelectionRow>;
  setRows: (rows: Array<TimeSelectionRow>) => void;
  kinds: Array<{
    is_default: unknown; display_label: string; code: string
}>;
  workChartId: number;
  isEditing: boolean;
  markAsChanged?: () => void; // <-- add prop here
}

const TimeRows = (props: TimeRowsProps) => {
  const { rows, setRows, kinds, workChartId, isEditing } = props;
  const previousChartIdRef = useRef<number | null>(null);

  const hoursChange = (rowId: number, newValue: number) => {
    let rowsCopy = [...rows];
    rowsCopy[rowId].duration = newValue * 60 + (rowsCopy[rowId].duration % 60);
    setRows([...rowsCopy]);
  };

  const minutesChange = (rowId: number, newValue: number) => {
    let rowsCopy = [...rows];
    rowsCopy[rowId].duration =
      rowsCopy[rowId].duration - (rowsCopy[rowId].duration % 60) + newValue;
    setRows([...rowsCopy]);
  };

  const kindChange = (rowId: number, newValue: string) => {
    let rowsCopy = [...rows];
    rowsCopy[rowId].kind_code = newValue;
    setRows([...rowsCopy]);
  };

  const addRow = () => {
    const availableKind = kinds?.find(
      (kind) => !rows.some((row) => row.kind_code === kind.code),
    );
    setRows([
      ...rows,
      {
        kind_code: availableKind?.code ?? "",
        duration: 0,
      } as TimeSelectionRow,
    ]);
  };

  const deleteRow = (rowIndex: number) => {
    let tempRows = [...rows];
    tempRows.splice(rowIndex, 1);
    setRows([...tempRows]);
  };

  useEffect(() => {
    if (!kinds || kinds.length === 0) return;

    const allowedCodes = new Set(kinds.map((kind) => kind.code));
    const defaultKind = kinds.find((kind) => kind.is_default) ?? kinds[0];
    const previousChartId = previousChartIdRef.current;
    const chartChanged =
      previousChartId !== null &&
      previousChartId !== undefined &&
      previousChartId !== workChartId;

    let didChange = false;
    const sanitizedRows = rows.map((row) => {
      if (!row.kind_code || allowedCodes.has(row.kind_code)) {
        return row;
      }
      didChange = true;
      return {
        ...row,
        kind_code: "",
      };
    });

    let workingRows = [...sanitizedRows];

    if (workingRows.length === 0) {
      workingRows = [
        {
          kind_code: "",
          duration: 0,
        } as TimeSelectionRow,
      ];
      didChange = true;
    }

    if (
      defaultKind &&
      (chartChanged ||
        !workingRows[0]?.kind_code ||
        !allowedCodes.has(workingRows[0].kind_code))
    ) {
      if (workingRows[0].kind_code !== defaultKind.code) {
        workingRows[0] = {
          ...workingRows[0],
          kind_code: defaultKind.code,
        };
        didChange = true;
      }
    }

    previousChartIdRef.current = workChartId;

    if (didChange) {
      setRows(workingRows);
    }
  }, [kinds, workChartId, isEditing]);

  return (
    <Box
      sx={{
        border: "solid 1px #ddd",
        display: "flex",
        flexDirection: "column",
        marginBottom: "10px",
        padding: "12px",
      }}
    >
      {rows?.map((row, index) => {
        const filteredKinds =
          kinds?.length > 0
            ? kinds?.filter(
                (kind) => !rows.some((row) => row.kind_code === kind.code),
              )
            : [];
        const activeKind = kinds?.find((kind) => kind.code === row.kind_code);
        return (
          <TimeRow
            key={index}
            kinds={
              activeKind ? [...filteredKinds, activeKind] : [...filteredKinds]
            }
            kindChange={kindChange}
            minutesChange={minutesChange}
            hoursChange={hoursChange}
            rowIndex={index}
            timeRow={row}
            addRow={addRow}
            deleteRow={deleteRow}
            disableAddButton={rows.length === kinds?.length}
            minusDisabled={rows.length <= 1}
            markAsChanged={props.markAsChanged} // <-- pass down
          />
        );
      })}
    </Box>
  );
};

export default TimeRows;
