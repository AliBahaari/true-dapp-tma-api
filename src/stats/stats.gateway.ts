import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server,Socket } from 'socket.io';

@WebSocketGateway(3001, {
  cors: {
    origin: '*',
  },
  namespace:"/socket",
  transports: ['websocket', 'polling'],
})
export class StatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client:Socket) {
    console.log("--------- new connection initialized --------")
    console.log(client)
    this.server.emit('onlineUsersCount', this.server.engine.clientsCount);
  }

  handleDisconnect() {
    this.server.emit('onlineUsersCount', this.server.engine.clientsCount - 1);
  }
}
