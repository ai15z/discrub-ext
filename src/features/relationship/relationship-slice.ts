import { createSlice } from "@reduxjs/toolkit";
import { AddFriendProps, RelationshipState } from "./relationship-types";
import { AppThunk } from "../../app/store";
import DiscordService from "../../services/discord-service";

const initialState: RelationshipState = {
  isLoading: null,
  friends: [],
};

export const relationshipSlice = createSlice({
  name: "relationship",
  initialState: initialState,
  reducers: {
    setIsLoading: (state, { payload }: { payload: boolean }): void => {
      state.isLoading = payload;
    },
    setFriends: (state, { payload }: { payload: unknown[] }): void => {
      state.friends = payload;
    },
  },
});

export const { setIsLoading, setFriends } = relationshipSlice.actions;

export const getFriends = (): AppThunk => async (dispatch, getState) => {
  const { settings } = getState().app;
  const { token } = getState().user;
  if (token) {
    dispatch(setIsLoading(true));
    const { success, data } = await new DiscordService(
      settings
    ).getRelationships(token);
    if (success && data) {
      dispatch(setFriends(data));
    } else {
      dispatch(setFriends([]));
    }
    dispatch(setIsLoading(false));
  }
};

export const addFriend =
  ({ username, discriminator }: AddFriendProps): AppThunk =>
  async (dispatch, getState) => {
    const { settings } = getState().app;
    const { token } = getState().user;
    if (token) {
      dispatch(setIsLoading(true));
      await new DiscordService(settings).sendFriendRequest(token, {
        username,
        discriminator,
      });
      dispatch(setIsLoading(false));
    }
  };

export const deleteFriend =
  (userId: Snowflake): AppThunk =>
  async (dispatch, getState) => {
    const { settings } = getState().app;
    const { token } = getState().user;
    //   const { friends } = getState().relationship;

    if (token) {
      dispatch(setIsLoading(true));
      const { success } = await new DiscordService(
        settings
      ).deleteFriendRequest(token, userId);
      if (success) {
        //   dispatch(setFriends(friends.filter((f) => f.user.id !== userId)));
      }
      dispatch(setIsLoading(false));
    }
  };

export const openDm =
  (userId: Snowflake): AppThunk =>
  async (dispatch, getState) => {
    const { settings } = getState().app;
    const { token } = getState().user;
    if (token) {
      dispatch(setIsLoading(true));
      await new DiscordService(settings).createDm(token, userId); // TODO: Possibly return a response so User knows if DM was opened successfully.
      dispatch(setIsLoading(false));
    }
  };

export default relationshipSlice.reducer;
