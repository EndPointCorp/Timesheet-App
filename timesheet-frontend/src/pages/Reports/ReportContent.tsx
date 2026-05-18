import { Dayjs } from "dayjs";
import { FC } from "react";
import "./reportContent.scss";
import { Snackbar, SnackbarCloseReason, Stack } from "@mui/material";
import PdfViewer from "./PdfViewer";
import React from "react";
import { Preset } from "./Reports";

const ReportContent: FC<{
  type: string;
  startDate: Dayjs;
  endDate: Dayjs;
  roles: Array<string>;
  report: { __html: any } | undefined | any;
  presetName: string;
  preset: Preset | null;
  setPresetName: Function;
  onSave: Function;
  isPdf: boolean;
}> = (props) => {
  const {
    type,
    startDate,
    endDate,
    roles,
    report,
    presetName,
    setPresetName,
    preset,
    onSave,
    isPdf,
  } = props;

  let usersString = "";
  for (let i = 0; i < roles.length; i++) {
    usersString += roles[i];
    if (i + 1 < roles.length) {
      usersString += ", ";
    }
  }

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const displaySnackbar = (openSnackbar: boolean) => {
    setOpenSnackbar(true);
  };
  const closeSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <>
      {isPdf ? (
        <PdfViewer pdfData={report.__html} />
      ) : (
        <div
          className="twelve columns white-highlighted"
          style={{ padding: "0px 12px", fontSize: "14px" }}
        >
          <Snackbar
            className="no-print"
            message="Preset was created successfully"
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={closeSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
          ></Snackbar>
          <section>
            <div className="twelve columns full_report">
              <Stack direction={"row"} justifyContent={"space-between"}>
                <p
                  style={{
                    fontSize: "20px",
                    fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
                    color: "rgb(34, 34, 34)",
                    margin: 0,
                    marginBottom: "14px",
                    marginTop: "14px",
                  }}
                >
                  Reports : {type}
                </p>
                {!preset && (
                  <div
                    id="save-as-preset"
                    className="ng-scope"
                    style={{
                      marginRight: "-12px",
                      width: "auto",
                      backgroundColor: "whiteSmoke",
                      top: "0",
                      padding: "10px 15px",
                      WebkitUserSelect: "none",
                      MozUserSelect: "none",
                      msUserSelect: "none",
                      userSelect: "none",
                    }}
                  >
                    <span className="greyed smaller">Preset name:</span>
                    <input
                      value={presetName}
                      onChange={(e) => {
                        setPresetName(e.target.value);
                      }}
                      type="text"
                      name="preset-name"
                      id="preset-name"
                      ng-model="$parent.namePresetName"
                      className="ng-pristine ng-untouched ng-valid"
                      style={{
                        height: "30px",
                        marginRight: "5px",
                        marginLeft: "5px",
                        userSelect: "text",
                      }}
                    />
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        onSave(presetName);
                        displaySnackbar(openSnackbar);
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </Stack>

              <div className="report_web">
                <div className="report_header">
                  <div ng-hide="isPdfProcessing">
                    <div
                      style={{ backgroundColor: "white" }}
                      className="report_meta"
                    >
                      <div>
                        <span>
                          <b>Selection Parameters</b>
                        </span>
                      </div>
                      <div>
                        <span className="title">Start Date:</span>
                        <span className="date_range ng-binding">
                          {startDate.format("YYYY/MM/DD")}
                          <span></span>
                        </span>
                      </div>
                      <div>
                        <span className="title">End Date:</span>
                        <span className="date_range ng-binding">
                          {endDate.format("YYYY/MM/DD")}
                          <span></span>
                        </span>
                      </div>
                      <div>
                        <span className="title">Roles:</span>
                        <span className="roles ng-binding">
                          {roles.length === 0
                            ? "All Reportable Users"
                            : usersString}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {report && <div dangerouslySetInnerHTML={report} />}
              </div>
              <div className="report_print"></div>
            </div>
            <div className="clearfix">&nbsp;</div>
          </section>
        </div>
      )}
    </>
  );
};

export default ReportContent;
