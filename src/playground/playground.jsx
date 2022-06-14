import React, { useCallback } from "react";

export default function Groups({ groups, onStartSession, flowWithGroup }) {
  const { currentUser } = useCurrentUser();
  const { isSafari } = useBrowser();

  const onGroupClick = useCallback(async (group) => {
    await trackClick(group.id);
  }, []);

  return (
    <GroupList
      groups={groups}
      onGroupClick={onGroupClick}
      onGroupStart={async (group) => {
        if (!currentUser) {
          return;
        }
        if (isSafari) onStartSession();
        await flowWithGroup(currentUser, group.id);
        if (!isSafari) onStartSession();
      }}
    />
  );
}

function GroupList({ groups, onGroupClick, onGroupStart }) {}
function useCurrentUser() {
  return { currentUser: {} };
}
function useBrowser() {
  return { isSafari: false };
}
async function trackClick(id) {}
