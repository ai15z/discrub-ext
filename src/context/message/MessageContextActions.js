import { fetchMessageData } from "../../discordService";
import {
  GET_MESSAGE_DATA,
  GET_MESSAGE_DATA_COMPLETE,
  UPDATE_FETCHED_MESSAGES,
  RESET_MESSAGE_DATA_COMPLETE,
  FILTER_MESSAGE,
  FILTER_MESSAGE_COMPLETE,
  UPDATE_FILTERS_COMPLETE,
} from "./MessageContextConstants";

export const updateFilters = async (
  filterName,
  filterValue,
  filterType,
  activeFilters,
  dispatch
) => {
  let filteredList = activeFilters.filter((x) => x.filterName !== filterName);
  let retFilters = [];
  if (filterType === "text") {
    if (filterValue.length > 0)
      retFilters = [
        ...filteredList,
        {
          filterName: filterName,
          filterValue: filterValue,
          filterType: filterType,
        },
      ];
    else retFilters = [...filteredList];
  } else if (filterType === "date") {
    if (filterValue !== null && filterValue !== "Invalid Date") {
      retFilters = [
        ...filteredList,
        {
          filterName: filterName,
          filterValue: filterValue,
          filterType: filterType,
        },
      ];
    } else retFilters = [...filteredList];
  }

  dispatch({ type: UPDATE_FILTERS_COMPLETE, payload: retFilters });
};

export const filterMessages = async (filters, messages, dispatch) => {
  dispatch({ type: FILTER_MESSAGE });
  let retArr = [];
  messages.forEach((x) => {
    let criteriaMet = true;
    filters.forEach((param) => {
      if (param.filterType === "text") {
        if (param.filterName === "attachmentName") {
          let csvAttachments = "";
          x.attachments.forEach((attachment) => {
            csvAttachments += attachment.filename + ",";
          });
          if (
            !csvAttachments
              .toLowerCase()
              .includes(param.filterValue.toLowerCase())
          ) {
            criteriaMet = false;
          }
        } else {
          let rowValue = x[param.filterName].toLowerCase();
          let filterValue = param.filterValue.toLowerCase();
          if (!rowValue.includes(filterValue)) {
            criteriaMet = false;
          }
        }
        return criteriaMet;
      } else if (param.filterType === "date") {
        if (param.filterName === "startTime") {
          let startTime = Date.parse(param.filterValue);
          let rowTime = Date.parse(x.timestamp);
          if (rowTime < startTime) {
            criteriaMet = false;
          }
        } else if (param.filterName === "endTime") {
          let endTime = Date.parse(param.filterValue);
          let rowTime = Date.parse(x.timestamp);
          if (rowTime > endTime) {
            criteriaMet = false;
          }
        }
      }
    });
    if (criteriaMet) retArr.push(x);
  });
  dispatch({ type: FILTER_MESSAGE_COMPLETE, payload: retArr });
};

export const resetMessageData = async (dispatch) => {
  dispatch({ type: RESET_MESSAGE_DATA_COMPLETE });
};

export const getMessageData = async (channelIdRef, token, dispatch) => {
  const originalChannelId = channelIdRef?.current?.slice();
  dispatch({ type: GET_MESSAGE_DATA });
  let retArr = [];
  try {
    let lastId = "";
    let reachedEnd = false;
    while (!reachedEnd) {
      if (channelIdRef.current !== originalChannelId) break;
      const data = await fetchMessageData(token, lastId, originalChannelId);
      if (data.message && data.message.includes("Missing Access")) break;
      if (data.length < 100) reachedEnd = true;
      if (data.length > 0) lastId = data[data.length - 1].id;
      if (data && (data[0]?.content || data[0]?.attachments)) {
        retArr = retArr.concat(data);
        dispatch({
          type: UPDATE_FETCHED_MESSAGES,
          payload: { fetchedMessageLength: retArr.length },
        });
      }
    }
  } catch (e) {
    console.error("Error fetching channel messages");
  } finally {
    dispatch({
      type: GET_MESSAGE_DATA_COMPLETE,
      payload: {
        messages: retArr.map((message) => ({
          ...message,
          username: message.author.username,
        })),
      },
    });
  }
};
