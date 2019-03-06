import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ChatMessage } from '../models/chat-message.model';
import { RdfService } from './rdf.service';
import { User } from '../models/user.model';
import { fn } from '@angular/compiler/src/output/output_ast';
import { async } from 'q';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';

@Injectable()
export class ChatService {

  chatMessages: ChatMessage[] = new Array<ChatMessage>();
  userName: string;
  userPhoto: string;
  friends: Array<User> = new Array<User>();

  constructor(private rdf : RdfService) {
    this.rdf.getSession();
    this.loadUserData().then(r => {
      this.loadFriends();
      this.loadMessages();
    });
  }

  getUser() {
    return of(new User(this.userName, this.userPhoto));
  }

  getUsers() : Observable<User[]> {
    return of(this.friends);
  }

  private async loadUserData() {
    await this.rdf.getSession();
    await this.rdf.getFieldAsStringFromProfile("fn").then(response => {
      this.userName = response;
    });
    await this.rdf.getFieldAsStringFromProfile("hasPhoto").then(response => {
      this.userPhoto = response;
    });
  }

  private async loadFriends() {
    await this.rdf.getSession();
    (await this.rdf.getFriends()).forEach(async element => {
      await this.rdf.fetcher.load(element.value);
      let photo: string = this.rdf.getValueFromVcard("hasPhoto", element.value) || "../assets/images/profile.png";
      this.friends.push(new User(this.rdf.getValueFromVcard("fn", element.value), photo));
    });
  }

  private async loadMessages() {
    await this.rdf.getSession();
    const messageFolder = "https://migarve55.solid.community/private/dechat/chat/";
    (await this.rdf.getElementsFromContainer(messageFolder)).forEach(async element => {
      const url = element.value + "#message";
      await this.rdf.fetcher.load(url);
      const sender = this.rdf.getValueFromSchema("sender", url);
      const text = this.rdf.getValueFromSchema("text", url);
      const dateSend = this.rdf.getValueFromSchema("dateSend", url);
      const date = Date.parse(dateSend);
      const name = await this.rdf.getFriendData(sender, "fn");
      this.addMessage(new ChatMessage(name, text, date));
    });
  }

  private addMessage(message : ChatMessage) {
    this.chatMessages.push(message);
    this.chatMessages = this.chatMessages.sort((m1, m2) => m1.timeSent.getMilliseconds() - m2.timeSent.getMilliseconds());
  }

  sendMessage(msg: string) {
    if(msg !== "") {
      const timestamp = this.getTimeStamp();
      const newMsg = new ChatMessage(this.userName, msg);
      this.chatMessages.push(newMsg);
    }
  }

  getMessages(): Observable<ChatMessage[]> {
    return of(this.chatMessages);
  }

  changeChat(user : User) {
    console.log("Change to: " + user.username);
  }

  private getTimeStamp() {
    const now = new Date();
    const date = now.getUTCFullYear() + '/' +
                 (now.getUTCMonth() + 1) + '/' +
                 now.getUTCDate();
    const time = now.getUTCHours() + ':' +
                 now.getUTCMinutes() + ':' +
                 now.getUTCSeconds();
    return (date + ' ' + time);
  }
}
