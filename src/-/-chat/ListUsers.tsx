import { observer } from 'mobx-react'
import React from 'react'

import UserItem from '../-contact/UserItem'
import g from '../global'
// import intl from '../intl/intl'
import chatStore from '../global/chatStore'
import { StyleSheet, TouchableOpacity } from '../Rn'
import { formatDateTimeSemantic } from './config'

const css = StyleSheet.create({
  Unread: {
    backgroundColor: g.colors.primaryFn(0.5),
  },
})

const ListUsers = p => (
  <React.Fragment>
    {p.recents.map(({ id, name, group, text, unread, created }) => (
      <TouchableOpacity
        key={id}
        onPress={() => (group ? p.onGroupSelect(id) : p.onUserSelect(id))} // TODO group
        style={(unread || chatStore.getThreadConfig(id).isUnread) && css.Unread}
      >
        <UserItem
          key={id}
          name={name}
          {...(group ? p.groupById : p.userById)[id]}
          lastMessage={text}
          isRecentChat
          lastMessageDate={formatDateTimeSemantic(created)}
        />
      </TouchableOpacity>
    ))}
  </React.Fragment>
)

export default observer(ListUsers)
