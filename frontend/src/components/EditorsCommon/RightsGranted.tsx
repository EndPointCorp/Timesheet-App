import { Box, Grid, Stack } from "@mui/material";
import { FC } from "react";
import { Right, RightType } from "./types";
import Text from "./Text";
import RightItem from "./RightItem";
import RightsPopoverSelector from "../RightsPopoverSelector";

interface RightsGrantedProps {
  userRights: Array<Right>;
  rights: Array<RightType>;
  removeRight: (id: number) => void;
  removeTarget: (
    rightId: number,
    targetId: number,
    isDirectRight?: boolean,
  ) => void;
  addTarget: (
    rightId: number,
    newTargetLabel: string,
    ref_obj_pk: number,
    isDirectRight?: boolean,
  ) => void;
  addRight: (id: RightType) => void;
}

const RightsGranted: FC<RightsGrantedProps> = (props) => {
  const { userRights, removeRight, removeTarget, addTarget, addRight, rights } =
    props;
  const availableRights = rights?.filter(
    (item) => !userRights.some((obj) => obj.code === item.code),
  );

  return (
    <>
      <Box sx={{ margin: "10px 0px", display: "flex" }}>
        <Text text={"Rights granted: "} />
      </Box>
      <Stack direction="row">
        <Stack direction={"column"} sx={{ width: "48%", marginRight: "10px" }}>
          {userRights.map((right, index) => {
            if (index % 2 === 0)
              return (
                <Grid item xs={6} sm={6} key={"Grid" + index}>
                  <RightItem
                    key={"Grid" + index}
                    right={right}
                    removeRight={removeRight}
                    removeTarget={removeTarget}
                    addTarget={addTarget}
                  />
                </Grid>
              );
          })}
          <RightsPopoverSelector
            list={availableRights}
            handleClick={addRight}
          />
        </Stack>
        <Stack direction={"column"} sx={{ width: "48%" }}>
          {userRights.map((right, index) => {
            if (index % 2 === 1)
              return (
                <Grid item xs={6} sm={6} key={"Grid" + index}>
                  <RightItem
                    key={"RightItem" + index}
                    right={right}
                    removeRight={removeRight}
                    removeTarget={removeTarget}
                    addTarget={addTarget}
                  />
                </Grid>
              );
          })}
        </Stack>
      </Stack>
    </>
  );
};

export default RightsGranted;
