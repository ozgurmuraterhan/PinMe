import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Container, Header, Title, Content, Form, Item, Input, Button, Label, Icon, Left, Body, Right, Picker, Textarea} from 'native-base';
import Expo, { Constants, Location, Permissions } from 'expo';
import API, { graphqlOperation } from '@aws-amplify/api';
import * as mutations from '../../graphql/mutations';
import Font from 'expo';
import MapView from 'react-native-maps';
import {store} from '../../../App'
import { Auth } from 'aws-amplify'

export default class PinInfo extends Component {
  constructor(props){
    super(props);

    this.state = {
        loading: true,
        pinInfo: {
          ...store.state.pinInfo
        }
    };

    this.handleChange.bind(this);
  }

  static navigationOptions = {
    header: null
  }

  // Needed for Native-Base Buttons
  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf")
    });
    this.setState({ loading: false });
  }

  handleChange(name, value){
    this.setState({
      pinInfo: {
        ...this.state.pinInfo,
        [name]: value
      }
    });
    store.update({
      pinInfo: {
        ...store.state.pinInfo,
        [name]: value
      }
    });
  }

  handleDropdown(value: string) {
    this.setState({
      pinInfo: {
        ...this.state.pinInfo,
        eventType: value
      }
    });
    store.update({
      pinInfo: {
        ...store.state.pinInfo,
        eventType: value
      }
    });
  }

  addPin() {

    const newPin = API.graphql(graphqlOperation(mutations.createPin,
      {
        input: store.state.pinInfo
      }
    ));
    this.props.navigation.navigate('Map');
  }

  render() {
    if (this.state.loading) {
      return <Expo.AppLoading />;
    }
    return (
      <Container>
        <StatusBar hidden/>

        <Header style = {{backgroundColor: '#03a9f4', height: 65}}>
          <View style = {{top: 20}}>
            <Body>
              <Title>Pin Information</Title>
            </Body>
          </View>
        </Header>

        <Content>
          <Form>

            <Item stackedLabel>
              <Label>Event Name </Label>
              <Input
              onChangeText={(e) => this.handleChange('eventName', e)}
              value={store.state.pinInfo.eventName}
                />
            </Item>

            <Item stackedLabel>
              <Label>Event Type </Label>
              <Item picker >
                <Picker
                  mode="dropdown"
                  iosIcon={<Icon name="ios-arrow-down-outline" />}
                  style={{ width: undefined }}
                  placeholder="Select the type of event"
                  placeholderStyle={{ color: "#bfc6ea" }}
                  placeholderIconColor="#007aff"
                  selectedValue={store.state.pinInfo.eventType}
                  onValueChange={this.handleDropdown.bind(this)}
                >
                  <Picker.Item label=""  />
                  <Picker.Item label="Accident" value="Accident" />
                  <Picker.Item label="Food" value="Food" />
                  <Picker.Item label="Social" value="Social" />
                  <Picker.Item label="Study" value="Study" />
                </Picker>
              </Item>
            </Item>

            <Item stackedLabel>
              <Label>Description </Label>
              <Input
                onChangeText={(e) => this.handleChange('description', e)}
                value={this.state.pinInfo.description}
              />
            </Item>

            <Item stackedLabel>
            <Label>Start Time</Label>
              <Item>
                <Icon active name='time' />
                <Input
                  placeholder='e.g. 11:30 AM'
                  placeholderTextColor = '#9e9e9e'
                  onChangeText={(e) => this.handleChange('startTime', e)}
                  value={this.state.pinInfo.startTime}
                  />
              </Item>
            </Item>

            <Item stackedLabel>
              <Label>End Time</Label>
              <Item>
                <Icon active name='time' />
                <Input
                placeholder='e.g. 2:00 PM'
                placeholderTextColor = '#9e9e9e'
                onChangeText={(e) => this.handleChange('endTime', e)}
                value={store.state.pinInfo.endTime}
                />
              </Item>
            </Item>

            <Button
            onPress={() => this.props.navigation.navigate('AddPin')}
            block style = {{top: 10, height: 60, backgroundColor: '#FFFFFF'}}>
              <Text style = {{color: '#000000'}}>Change Location</Text>
            </Button>

          </Form>

          <Content>
            <Button
            onPress={() => this.addPin()}
            block style = {{top: 20, height: 60, backgroundColor: '#79e56a',}}>
              <Text style = {{color: '#FFFFFF'}}>Create Pin</Text>
            </Button>
            <Button
            onPress={() => {this.props.navigation.navigate('Map');
                            this.handleChange('eventName', '');
                            this.handleChange('description', '');
                            this.handleDropdown('')}}
            block style = {{top: 30, height: 60, backgroundColor: '#9e9e9e'}}>
              <Text style = {{color: '#FFFFFF'}}>Cancel</Text>
            </Button>
            <Button disabled style = {{top: 40, height: 60, backgroundColor: '#FFFFFF'}}>
            </Button>
          </Content>


        </Content>
      </Container>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  }
});
