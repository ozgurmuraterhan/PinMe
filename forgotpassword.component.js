import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, StatusBar, KeyboardAvoidingView } from 'react-native';
import { Container, Header, Button, Item, Input, Label} from 'native-base';
import * as Animatable from 'react-native-animatable';
import { Col, Row, Grid } from 'react-native-easy-grid';
import Expo, { Constants, Location, Permissions } from 'expo';
import Font from 'expo';
import MapView from 'react-native-maps';
import {authInfo} from './App.js'
import { Auth } from 'aws-amplify';

 var {width, height} = Dimensions.get('window');

 AnimatedItem = Animatable.createAnimatableComponent(Item);
 AnimatedButton = Animatable.createAnimatableComponent(Button);

export default class ForgotPassword extends Component {
  constructor(props){
    super(props);

    this.state = {
        loading: true,
        username: "",
    };
  }

  static navigationOptions = {
    header: null
  }

  handleChange(name, value) {
    this.setState({ [name]: value });
  }

  checkInput(){
    let error = false;
    if (this.state.username.trim() === "") {
      this.setState(() => ({ nameError: "username required." }));
      error = true;
    } else {
      this.setState(() => ({ nameError: null }));
    }

    if(error){
      return false;
    } else {
      return true;
    }
  }

  resetPassword(){
    let username = this.state.username;
    Auth.forgotPassword(username)
    .then(data => {console.log(data); this.props.navigation.navigate('ChangePassword');})
    .catch(err => console.log(err));
  }

  // Needed for Native-Base Buttons
  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf")
    });
    this.setState({ loading: false });
    this.refs.firstTitle.bounceInDown();
    this.refs.secondTitle.bounceInDown();
    this.refs.item.bounceInDown();
  }

  render() {
    if (this.state.loading) {
      return <Expo.AppLoading />;
    }
    return (
      <Container>
      <StatusBar hidden/>

        <Grid>

          <Col size={10.5} style={{ backgroundColor: '#03a9f4', justifyContent: 'center'}}>
            <Animatable.Text ref="firstTitle" style={[styles.title, {top: 0}]}>Forgot</Animatable.Text>
            <Animatable.Text ref="secondTitle" style={[styles.title, {top: 60}]}>Password</Animatable.Text>
            <AnimatedItem ref="item" style={styles.inputItem}>
              <Label style={styles.label} >Username</Label>
              <Input placeholderTextColor='#017BB0' placeholder="username" style={styles.input}
                onChangeText={(e) => {
                  this.handleChange('username', e);
                  if(e.trim() !== "") {this.setState(() => ({ nameError: null }));}
                }}
                value={this.state.username}
              />
            </AnimatedItem>
            {!!this.state.nameError && (
              <Label style={styles.error}>{this.state.nameError}</Label>
            )}
          </Col>

          <Row size={1} style={{ backgroundColor: '#03a9f4', justifyContent: 'space-around'}}>

            <Button ref="leftButton" large
              onPress={() => {
                const a = setTimeout(() => {
                  this.props.navigation.goBack();
                }, 0);
              }}
              style={styles.leftButton}
              >
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </Button>

            <Button ref="rightButton" large
              style={styles.rightButton}
              onPress={() => {
                if(this.checkInput() === false){
                  console.log('something is empty');
                } else {
                  console.log('No empty fields!');
                  this.resetPassword();
                }
              }}
              >
              <Text style={styles.buttonText}>Send</Text>
            </Button>
          </Row>

        </Grid>
      </Container>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'sans-serif-thin'
  },
  title: {
    position: 'absolute',
    left: 15,
    color: 'white',
    fontSize: 60,
    fontFamily: 'sans-serif-thin'
  },
  error: {
    bottom: 90,
    color: "white",
    fontFamily: 'sans-serif-thin',
    left: 19
  },
  input: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'sans-serif-light',
    marginRight: 20,
    top: 3,
  },
  inputItem: {
    bottom: 80,
    left: 15,
    borderColor: 'transparent'
  },
  buttonText: {
    color: '#03a9f4',
    fontSize: 15,
    fontFamily: 'sans-serif-light'
  },
  leftButton: {
    width: width/2-20,
    height: 55,
    marginLeft: 5,
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  rightButton: {
    width: width/2-20,
    height: 55,
    marginRight: 5,
    justifyContent: 'center',
    backgroundColor: 'white'
  }
});
