import React, { Component } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native'

const LoginView = Platform.select({
  ios: () => KeyboardAvoidingView,
  android: () => View,
})();

import Button from '../components/button'
import SendBird from 'sendbird'
import {OPEN_CHANNEL_URL} from '../consts';

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      connectLabel: 'CONNECT',
      buttonDisabled: false,
      connection: props.route.connection || false,
      errorMessage: ''
    };
    this._onPressConnect = this._onPressConnect.bind(this);
  }

  componentWillMount(){
    if (this.state.connection){
      sb.disconnect();
      var _SELF = this;
      _SELF.setState({
        buttonDisabled: false,
        connectLabel: 'CONNECT',
        connection: false
      });
    }
  }

  _onPressConnect() {
    Keyboard.dismiss();

    this.setState({
      errorMessage: '',
      buttonDisabled: true,
      connectLabel: 'CONNECTING...'
    });

    if (this.state.username.trim().length == 0) {
      this.setState({
        username: '',
        buttonDisabled: false,
        connectLabel: 'CONNECT',
        errorMessage: 'User Nickname must be required.'
      });
      return;
    }

    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    if (regExp.test(this.state.username)) {
      this.setState({
        username: '',
        buttonDisabled: false,
        connectLabel: 'CONNECT',
        errorMessage: 'Please only alphanumeric characters.'
      });
      return;
    }

    sb = SendBird.getInstance();
    var _SELF = this;
    sb.connect(_SELF.state.username, function (user, error) {
      if (error) {
        _SELF.setState({
          username: '',
          buttonDisabled: false,
          connectLabel: 'CONNECT',
          errorMessage: 'Login Error'
        });
        console.log(error);
        return;
      }

      if (Platform.OS === 'ios') {
        if (sb.getPendingAPNSToken()){
          sb.registerAPNSPushTokenForCurrentUser(sb.getPendingAPNSToken(), function(result, error){
            console.log("APNS TOKEN REGISTER AFTER LOGIN");
            console.log(result);
          });
        }
      } else {
        if (sb.getPendingGCMToken()){
          sb.registerGCMPushTokenForCurrentUser(sb.getPendingGCMToken(), function(result, error){
            console.log("GCM TOKEN REGISTER AFTER LOGIN");
            console.log(result);
          });
        }
      }

      sb.updateCurrentUserInfo(_SELF.state.username, '', function(response, error) {
        _SELF.setState({
          connection: true,
          errorMessage: ''
        });

        sb.OpenChannel.getChannel(OPEN_CHANNEL_URL, function (channel, error) {
          if (error) {
            console.error(error);
            return;
          }

          channel.enter(function(response, error){
            if (error) {
              console.error(error);
              return;
            }
            _SELF.props.navigator.push({name: 'chat', channel: channel});
          });
        });
      });
    });
  }

  _buttonStyle() {
    return {
      backgroundColor: '#53c3fb',
      underlayColor: '#53a3db',
      borderColor: '#53c3fb',
      disabledColor: '#ababab',
      textColor: '#ffffff'
    }
  }

  render() {
    return (
      <LoginView behavior='padding' style={styles.container} >
        <View style={styles.loginContainer}>

          <TextInput
            style={[styles.input, {marginTop: 10}]}
            value={this.state.username}
            onChangeText={(text) => this.setState({username: text})}
            onSubmitEditing={Keyboard.dismiss}
            placeholder={'Enter User Nickname'}
            maxLength={12}
            multiline={false}
            />

          <Button
            text={this.state.connectLabel}
            style={this._buttonStyle()}
            disabled={this.state.buttonDisabled}
            onPress={this._onPressConnect}
          />

          <Text style={styles.errorLabel}>{this.state.errorMessage}</Text>

        </View>
      </LoginView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#b6e5e5'
  },
  loginContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  input: {
    width: 250,
    color: '#555555',
    padding: 10,
    height: 50,
    borderColor: '#53c3fb',
    borderWidth: 1,
    borderRadius: 4,
    alignSelf: 'center',
    backgroundColor: '#b6e5e5'
  },
  errorLabel: {
    color: '#ff0200',
    fontSize: 13,
    marginTop: 10,
    width: 250
  }
});
