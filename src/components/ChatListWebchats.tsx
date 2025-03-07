import { observer } from 'mobx-react'
import React, { FC } from 'react'

import { ChatGroup } from '../stores/chatStore'
import { WebchatItem } from './WebchatItem'

export const ListWebchats: FC<{
  datas: ChatGroup[]
}> = observer(p => (
  <>
    {p.datas.map(
      (item: ChatGroup) =>
        item.webchat && <WebchatItem key={item.id} data={item.webchat} />,
    )}
  </>
))
