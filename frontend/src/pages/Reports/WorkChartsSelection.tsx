import React, { forwardRef } from "react";
import { useState, FC, useEffect } from "react";
import workchartHooks from "../../hooks/workchartHooks";
import {
  Box,
  Button,
  FormControl,
  OutlinedInput,
  Popover,
  Stack,
} from "@mui/material";
import MySwitch from "../../components/MySwitch";
import { Link } from "react-router-dom";

interface WorkChartsSelectionProps {
  workChartId: number;
  setWorkChartId: (id: number) => void;
  generateClick?: () => void;
  showHidden?: boolean;
  marginLeft?: string;
  hideSearchAll?: boolean;
  pdf?: boolean;
  setPdf?: (pdf: boolean) => void;
  setHasChildren?: (hasChildren: boolean) => void;
  includeNonleafs?: boolean;
  forceIncludeHidden?: boolean;
  includeDead?: boolean;
  forceIncludeDead?: boolean;
}

const WorkChartsSelection = forwardRef<
  HTMLInputElement,
  WorkChartsSelectionProps
>((props, ref) => {
  const {
    workChartId,
    setWorkChartId,
    generateClick,
    showHidden = false,
    marginLeft = "12px",
    hideSearchAll = false,
    pdf = false,
    setPdf = () => {},
    setHasChildren = () => {},
    includeNonleafs = false,
    forceIncludeHidden = false,
    includeDead = false,
    forceIncludeDead = false,
  } = props;
  const [inputValue, setInputValue] = useState("");
  // If forceIncludeHidden is true, include hidden nodes by default and hide the toggle
  const [showAll, setShowAll] = useState<boolean>(forceIncludeHidden || false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { data: quicks } = workchartHooks.useGetQuicks();
  const { data: workCharts, isFetching: isFetchingWorkCharts } =
    workchartHooks.useGetWorkCharts() as any;
  const { data: search } = workchartHooks.useGetSearch({
    term: inputValue,
    includeHidden: showAll || forceIncludeHidden,
    includeNonleafs,
    includeDead: includeDead || forceIncludeDead,
  });
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (workCharts !== undefined) {
      const workChart = workCharts.find(
        (entry: { id: number }) => entry.id === workChartId,
      );

      // Root/unselected placeholder (id 2): keep the box blank and skip child detection
      // so we don't treat the placeholder as a real selection.
      if (workChartId === 2) {
        setInputValue("");
        setHasChildren(false);
        return;
      }

      if (!workChart) {
        return;
      }

      let workChartLabel = "";
      for (let i = 1; i < workChart.labels.length; i++) {
        workChartLabel +=
          workChart.labels[i] + (i + 1 < workChart.labels.length ? " - " : "");
      }
      setInputValue(workChartLabel);
      const children = workCharts.filter(
        (entry: { parent_id: number; status: string }) => {
          return (
            entry.parent_id === workChart.id &&
            (entry.status === "active" ||
              (entry.status === "hidden" && showAll))
          );
        },
      );
      if (children.length > 0) {
        setHasChildren(true);
      } else {
        setHasChildren(false);
      }
    }
  }, [workChartId, workCharts, showAll]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const WorkChartLevel: FC<{ id: number; label: string }> = (props) => {
    const { id } = props;
    if (id === 1) {
      return null;
    }
    let { label } = props;
    const workChart = workCharts.filter((entry: { id: number }) => {
      return entry.id === id;
    })[0];

    if (!workChart)
      return (
        <p>
          Work chart {workChartId} not found. Click here to{" "}
          <Link to="/" onClick={() => setWorkChartId(2)}>
            Deselect work chart.
          </Link>
        </p>
      );

    const children = workCharts.filter(
      (entry: { parent_id: number; status: string }) => {
        return (
          entry.parent_id === id &&
          (entry.status === "active" || (entry.status === "hidden" && showAll))
        );
      },
    );
    children.unshift({
      id: workChart?.id,
      parent_id: 1,
      display_label: "",
    });

    const removeSelected = (event: {
      currentTarget: { classList: { remove: (arg0: string) => void } };
    }) => {
      event.currentTarget.classList.remove("Mui-selected");
    };

    return (
      <Box>
        <WorkChartLevel
          key={`level-${id}`}
          id={workChart.parent_id}
          label={workChart.labels[workChart.labels.length - 1]}
        />
        {children.length > 1 && (
          <FormControl key={`form-${id}`}>
            <select
              key={`select-${id}`}
              value={children
                .find(
                  (c: { display_label: string }) => c.display_label === label,
                )
                ?.id.toString()}
              onChange={(event: any) => {
                setWorkChartId(Number(event.target.value));
              }}
              className="work-chart-select select-dropdown-menu"
              disabled={isFetchingWorkCharts}
            >
              {children.map(
                (child: { id: number; display_label: string }, key: number) => (
                  <option
                    key={`option-${key}`}
                    value={child.id.toString()}
                    onMouseLeave={removeSelected}
                  >
                    {child.display_label}
                  </option>
                ),
              )}
            </select>
          </FormControl>
        )}
      </Box>
    );
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;
  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <Box
        sx={{
          position: "relative", // Ensure the search results are positioned relative to this container
          marginLeft: marginLeft,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FormControl sx={{ marginBottom: "10px" }}>
          <OutlinedInput
            placeholder="Type to search through work charts"
            value={inputValue}
            className="workChartBorder"
            label="workChart"
            onChange={(e: any) => {
              setInputValue(e.target.value || "");
            }}
            onKeyDown={(e) => {
              if (!search || search.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedIndex((prev) => {
                  const startIndex =
                    hoveredIndex !== null ? hoveredIndex : prev;
                  setHoveredIndex(null); // Clear hover state once navigation starts
                  return startIndex === null || startIndex === search.length - 1
                    ? 0
                    : startIndex + 1;
                });
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedIndex((prev) => {
                  const startIndex =
                    hoveredIndex !== null ? hoveredIndex : prev;
                  setHoveredIndex(null); // Clear hover state once navigation starts
                  return startIndex === null || startIndex === 0
                    ? search.length - 1
                    : startIndex - 1;
                });
              } else if (e.key === "Enter" && focusedIndex !== null) {
                e.preventDefault();
                setWorkChartId(search[focusedIndex].id);
                setFocusedIndex(null); // Reset focus after selection
              }
            }}
            onFocus={handleFocus}
            onBlur={() => {
              setIsFocused(false);
              setFocusedIndex(null); // Reset focus when input loses focus
              setHoveredIndex(null); // Reset hover when input loses focus
            }}
            inputRef={ref}
            sx={{
              width: "365px",
              height: "30px",
              backgroundColor: "white",
              border: "1px solid #cccccc",
              borderRadius: "2px",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
              color: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              transition: "all 0.15s linear",
              fontSize: "14px",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& .workChartBorder:hover .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
        </FormControl>

        {search?.length > 0 && isFocused && (
          <Stack
            direction={"column"}
            sx={{
              position: "absolute",
              top: "30px",
              left: 0,
              borderColor: "#ececec",
              borderWidth: "1px",
              borderStyle: "solid",
              borderRadius: "2px",
              width: "365px",
              padding: "6px",
              cursor: "pointer",
              zIndex: "9999",
              backgroundColor: "#ffffff",
            }}
          >
            {search.map(
              (searchResult: { label: string; id: number }, index: number) => (
                <Box
                  key={searchResult.id}
                  data-id={searchResult.id}
                  tabIndex={-1} // Remove from tab order, focus is managed programmatically
                  onMouseEnter={() => {
                    setHoveredIndex(index); // Set hover state
                    setFocusedIndex(null); // Clear keyboard focus
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null); // Clear hover state when mouse leaves
                  }}
                  onMouseDown={() => setWorkChartId(searchResult.id)}
                  sx={{
                    padding: "5px",
                    color:
                      hoveredIndex === index || focusedIndex === index
                        ? "white"
                        : "#000000",
                    backgroundColor:
                      hoveredIndex === index || focusedIndex === index
                        ? "#0098FF"
                        : "transparent",
                    backgroundImage:
                      hoveredIndex === index || focusedIndex === index
                        ? "linear-gradient(to bottom, #0098FF, #0044cc)"
                        : "none",
                    paddingBottom: "4px",
                    borderBottom: "1px dotted #ddd",
                    fontSize: "12px !important",
                  }}
                >
                  {searchResult.label}
                </Box>
              ),
            )}
          </Stack>
        )}

        {workCharts && <WorkChartLevel id={workChartId} label={""} />}
      </Box>
      <Box
        sx={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}
      >
        <Button
          aria-describedby={id}
          variant="contained"
          onClick={handleClick}
          sx={{
            color: "white",
            backgroundColor: "#006DCC",
            boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
            backgroundImage:
              "linear-gradient(to bottom, #08C, #04C) !important",
            borderColor: "#04C #04C #002A80 !important",
            cursor: "pointer",
            width: "140px",
            height: "30px",
            textAlign: "center",
            marginRight: "10px",
            display: "inline-block",
            borderRadius: "4px !important",
            fontSize: "13px",
            textTransform: "none",
            fontWeight: "500",
            padding: "5.5px",
          }}
        >
          Quick pick
          <span className="icon-down-dir"></span>
        </Button>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            horizontal: "center",
            vertical: "top",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              color: "white",
              padding: "10px",
              overflow: "auto",
              zIndex: 99999,
              boxShadow: "#666 0px 0px 8px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <p className="quicks-header">Clients</p>
              {quicks &&
                quicks?.clients.map(
                  (clientValue: { labels: Array<string>; id: number }) => {
                    let client = "";
                    for (let i = 0; i < clientValue.labels.length; i++) {
                      client += clientValue.labels[i];
                      if (i + 1 !== clientValue.labels.length) client += " / ";
                    }
                    return (
                      <p
                        key={clientValue.id}
                        className="quicks"
                        onClick={() => {
                          setWorkChartId(clientValue.id);
                          handleClose();
                        }}
                      >
                        {client.replace(/clients \//gi, "")}
                      </p>
                    );
                  },
                )}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "10px",
              }}
            >
              <p className="quicks-header">Other</p>
              {quicks &&
                quicks?.others.map(
                  (othersValue: { labels: Array<string>; id: number }) => {
                    let others = "";
                    for (let i = 0; i < othersValue.labels.length; i++) {
                      others += othersValue.labels[i];
                      if (i + 1 !== othersValue.labels.length) others += " / ";
                    }
                    return (
                      <p
                        key={othersValue.id}
                        className="quicks"
                        onClick={() => {
                          setWorkChartId(othersValue.id);
                          handleClose();
                        }}
                      >
                        {others}
                      </p>
                    );
                  },
                )}
            </Box>
          </Box>
        </Popover>
        {!hideSearchAll && !forceIncludeHidden && (
          <MySwitch
            checked={showAll}
            setChecked={setShowAll}
            label={showHidden ? "Show hidden: " : "Search all: "}
            ariaLabel={showHidden ? "Show hidden toggle" : "Search all toggle"}
            dataTestId={
              showHidden
                ? "reports-show-hidden-toggle"
                : "reports-search-all-toggle"
            }
          />
        )}
        {generateClick && (
          <MySwitch
            checked={pdf}
            setChecked={setPdf}
            label={"PDF: "}
            ariaLabel="PDF toggle"
            dataTestId="reports-pdf-toggle"
          />
        )}
        {/*@ts-ignore */}
        {generateClick && (
          <Button
            onClick={generateClick}
            sx={{
              cursor: "pointer",
              MozBoxShadow: "inset 0px 1px 0px 0px #228fee",
              WebkitBoxShadow: "inset 0px 1px 0px 0px #228fee",
              boxShadow: "inset 0px 1px 0px 0px #228fee",
              backgroundImage:
                "linear-gradient(to bottom, #0088cc, #0044cc) !important",
              backgroundColor: "#006DCC",
              WebkitBorderTopLeftRadius: "4px",
              MozBorderRadiusTopleft: "4px",
              borderTopLeftRadius: "4px",
              WebkitBorderTopRightRadius: "4px",
              MozBorderRadiusTopright: "4px",
              borderTopRightRadius: "4px",
              WebkitBorderBottomRightRadius: "4px",
              MozBorderRadiusBottomright: "4px",
              borderBottomRightRadius: "4px",
              WebkitBorderBottomLeftRadius: "4px",
              MozBorderRadiusBottomleft: "4px",
              borderBottomLeftRadius: "4px",
              textIndent: "0",

              display: "inline-block",
              color: "white",
              fontFamily: '"Roboto", Helvetica, Arial, sans-serif',
              fontWeight: 500,
              fontSize: "13px",
              fontStyle: "normal",
              height: "30px",
              lineHeight: "26px",
              textDecoration: "none",
              textAlign: "center",

              padding: "0px",
              paddingLeft: "10px",
              paddingRight: "10px",
              width: "77px",
              textTransform: "none",
            }}
          >
            Generate
          </Button>
        )}
      </Box>
    </Box>
  );
});

export default WorkChartsSelection;
