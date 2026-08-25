import { Box, Link, Stack } from "@mui/material";
import { FC, useEffect, useState } from "react";
import HelpIcon from "../../components/Icons/HelpIcon";
import BlueButton from "../../components/MyButton/BlueButton";
import workchartHooks from "../../hooks/workchartHooks";
import { WorkChart } from "./General";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface ChildrenProps {
  children: Array<string> | undefined;
  workCharts: Array<WorkChart> | undefined;
  workChartId: number;
}

interface ExtractedChild {
  label: string;
  isInherited: boolean;
  status: string;
  id: number;
}

const Children: FC<ChildrenProps> = (props) => {
  const { children, workCharts, workChartId } = props;
  const [newChild, setNewChild] = useState("");
  const { mutateAsync: addChild, isLoading: isAdding } =
    workchartHooks.useAddChild() as any;
  const [extractedChildren, setExtractedChildren] = useState<ExtractedChild[]>(
    [],
  );

  useEffect(() => {
    if (workCharts && workCharts.length > 0) {
      const extractedChildren = workCharts
        .filter((e: WorkChart) => Number(e.parent_id) === workChartId)
        .map((e: WorkChart) => {
          const isInherited = children?.includes(e.display_label) || false;
          return {
            label: e.display_label,
            isInherited,
            status: e.status,
            id: e.id,
          };
        });
      setExtractedChildren(extractedChildren);
    }
  }, [children, workCharts, workChartId]);

  const handleAddChild = async () => {
    try {
      await addChild({
        parent_id: workChartId,
        display_label: newChild,
        status: "active",
      }).then((res: any) => {
        console.log(res);
        if (!res || res.status !== 200 || res.data.status !== "OK") {
          throw new Error("Failed to add child");
        }

        const returnedChart: WorkChart = res?.data.chart;
        setNewChild("");

        setExtractedChildren((prev) => [
          ...prev,
          {
            label: newChild,
            isInherited: true,
            status: "active",
            id: returnedChart.id,
          },
        ]);
        setNewChild(""); // Clear the input field after adding
      });
    } catch (error) {
      window.alert(
        "An error occurred while adding the child. Please try again.",
      );
    }
  };

  return (
    <Box
      sx={{
        marginTop: "20px",
        backgroundColor: "rgba(0, 0, 0, 0.03)",
        paddingLeft: "20px",
        paddingBottom: "16px",
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", marginBottom: "16px" }}
      >
        <Box
          sx={{
            width: "66.6%",
            display: "flex",
            alignItems: "center",
          }}
        >
          {extractedChildren && extractedChildren?.length > 0 ? (
            <>
              <HelpIcon
                maxWidth={400}
                margin={11}
                text={
                  <>
                    <p>
                      <span
                        style={{
                          display: "inline-flex",
                          verticalAlign: "middle",
                          boxSizing: "inherit",
                          textAlign: "center",
                          alignItems: "center",
                          height: "12px",
                        }}
                      >
                        <HelpOutlineIcon />
                      </span>{" "}
                      List of children
                    </p>
                    <p>
                      It shows all children for a currently edited work chart.
                      Greyed out items mark inactive work charts. Ones with
                      strikethrough mark dead charts. The symbol "⇣" marks a
                      child that inherits its duration kinds from its parents.
                      Charts having their own customized sets are marked with
                      the "⊙" symbol.
                    </p>
                  </>
                }
              />
              <p style={{ marginTop: "6px" }}>
                {extractedChildren.length} children listed below:
              </p>
            </>
          ) : (
            <p style={{ marginTop: "6px" }}>This work chart has no children</p>
          )}
        </Box>
        <Box
          sx={{
            width: "33.3%",
            padding: "10px",
            display: "flex",
            background: "rgba(0, 0, 0, 0.03)",
          }}
        >
          <Box sx={{ width: "66.6%", padding: "0 12px 0 6px" }}>
            <input
              type="text"
              value={newChild}
              onChange={(event) => setNewChild(event.target.value)}
              className="new-child-input"
            />
          </Box>
          <BlueButton
            name={isAdding ? "Adding..." : "Add"}
            onClick={handleAddChild}
            width="33.3%"
            marginRight="0"
            disabled={isAdding || newChild.trim().length === 0}
          />
        </Box>
      </Stack>
      {extractedChildren
        ?.sort((a, b) => a.label.localeCompare(b.label))
        ?.map((child) => {
          return (
            <Link
              href={`/#/work_charts/editor?work_chart_id=${child.id}`}
              sx={{
                width: "33.3%",
                cursor: "pointer",
                listStyleType: "none",
                fontSize: "12px",
                float: "left",
                opacity: child.status === "active" ? 1 : 0.5,
              }}
            >
              {child.isInherited ? "⇣" : "⊙"}
              {child.label}
            </Link>
          );
        })}
    </Box>
  );
};

export default Children;
