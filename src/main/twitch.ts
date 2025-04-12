import { ApiClient, HelixUser } from '@twurple/api';
import { StaticAuthProvider, getTokenInfo } from '@twurple/auth';

var twitchLoggedIn = false
var liveCheckInt
export async function twitchAPI(accessToken: string, buildMenu: Function): Promise<ApiClient | null> {
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
    return null
  }

  async function sendLiveChannels() {
    let result = await apiClient.channels.getFollowedChannelsPaginated(thisUserId || "")
    let channels = await result.getAll()
  
    let userProms: Promise<HelixUser | null>[] = []
    
    channels.forEach(async (channel) => {
      userProms.push(new Promise(async (res, _rej) => {
        let user = await channel.getBroadcaster()
        res(user)
      }))
      
    })

    let followedUsers = await Promise.all(userProms)
  
    let streams = await apiClient.streams.getFollowedStreamsPaginated(thisUserId || "").getAll()
    console.log("Current Streams: ", streams)
    
    let channelObj = channels.map(channel => {
      let stream = streams.find(stream => stream?.userId == channel.broadcasterId)
      return {
        id: channel.broadcasterId,
        picture: followedUsers.find(user => user?.id == channel.broadcasterId)?.profilePictureUrl,
        name: channel.broadcasterName,
        display_name: channel.broadcasterDisplayName,
        game: stream?.gameName,
        title: stream?.title,
        startTime: (stream ? stream.startDate.valueOf() : null),
        viewers: (stream ? stream.viewers : null),
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

  return apiClient
}