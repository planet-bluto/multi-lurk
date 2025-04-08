import { ApiClient, HelixStream } from '@twurple/api';
import { StaticAuthProvider, getTokenInfo } from '@twurple/auth';

var twitchLoggedIn = false
var liveCheckInt
export async function twitchAPI(accessToken: string, buildMenu: Function): Promise<void> {
  if (liveCheckInt) {clearInterval(liveCheckInt)}
  // if (twitchLoggedIn) return;
  const clientId = 'ycckwz67ehj6urlv3dqz1ax9bcbo3j';

  const authProvider = new StaticAuthProvider(clientId, accessToken);

  const apiClient = new ApiClient({ authProvider });

  const thisUserId = (await getTokenInfo(accessToken)).userId;

  if (twitchLoggedIn) { console.log("good job!") }

  twitchLoggedIn = true
  if (thisUserId == null) {
    console.log("Fuck.... ", thisUserId)
    twitchLoggedIn = false
    return
  }

  async function sendLiveChannels() {
    let result = await apiClient.channels.getFollowedChannelsPaginated(thisUserId || "")
    let channels = await result.getAll()
  
    let streamProms: Promise<HelixStream | null>[] = []
    
    channels.forEach(async (channel) => {
      streamProms.push(new Promise(async (res, _rej) => {
        let broadcaster = await channel.getBroadcaster()
        let stream = await broadcaster.getStream()
        res(stream)
      }))
      
    })
  
    let streams = await Promise.all(streamProms)
    streams.filter(stream => stream != null)
    console.log("Current Streams: ", streams)
    
    let channelObj = channels.map(channel => {
      let stream = streams.find(stream => stream?.userId == channel.broadcasterId)
      return {
        id: channel.broadcasterId,
        name: channel.broadcasterName,
        display_name: channel.broadcasterDisplayName,
        label: (stream ? `[LIVE] ${channel.broadcasterDisplayName} | ${stream.gameName} | ${stream.title}` : `[OFFLINE] ${channel.broadcasterDisplayName}` ),
        streaming: (stream != null)
      }
    })
  
    channelObj.sort((a, b) => {
      if (a.streaming && !b.streaming) return -1
      if (!a.streaming && b.streaming) return 1
      return a.display_name.localeCompare(b.display_name)
    })
  
    buildMenu(channelObj)
  }

  sendLiveChannels()

  liveCheckInt = setInterval(() => {
    sendLiveChannels()
  }, 60000)
}