/*import React, { Component } from 'react';
import {ScrollView, AppRegistry, FlatList, StyleSheet, Text, View, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Card, CardItem, Body, Container, Header, Content, Form, Icon, Item, Input, Button } from 'native-base';
import Expo, { Constants, Location, Permissions } from 'expo';
import MapView from 'react-native-maps';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import API, { graphqlOperation } from '@aws-amplify/api'
import {store} from '../../../App'

export default class SearchScreen extends Component {
  constructor(props){
    super(props);



    this.state = {
        loading: true,
        markers: store.getState()
    }

  }


handleSearch = (text) => {
    console.log("text", text);
    store.update({markers: text});
};

  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf"),
    });
    this.setState({
      loading: false,
     });
  }

  render() {
      if (this.state.loading) {
    return <Expo.AppLoading />;
  }
    return (
<ScrollView>
      <StatusBar hidden/>
      <Header searchBar rounded>
          <Item>
            <Icon name="ios-search" />
            <Input
            placeholder="Search"
            onChangeText={ (search) => this.handleSearch(search)}/>
            <Icon name="ios-people" />
          </Item>
          <Button transparent>
            <Text>Search</Text>
          </Button>
        </Header>
      <Content padder>
      {store.getState().markers.map((marker, index) => (
        <Card
        key={marker.key}
        >
          <CardItem  header bordered>
          <Text>{marker.name}</Text>
          </CardItem>
          <CardItem  bordered>
          <Body>
            <Text>{marker.description}</Text>
            </Body>
          </CardItem>
        </Card>
      ))}
      </Content>
      </ScrollView>


    );
  }
}



const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  }
});*/

import React, { Component } from 'react';
import {ScrollView, AppRegistry, FlatList, StyleSheet, Text, View, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Card, CardItem, Body, Container, Header, Content, Form, Icon, Item, Input, Button, Right, Left } from 'native-base';
import Expo, { Constants, Location, Permissions } from 'expo';
import MapView from 'react-native-maps';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import API, { graphqlOperation } from '@aws-amplify/api'
import {store} from '../../../App'


export default class SearchScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
        loading: true,
        markers: [],
        searchText: ""
    }
  }

  static navigationOptions = {
    header: null
  }

  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf"),
      Entypo: require("native-base/Fonts/Entypo.ttf"),
      FontAwesome: require("native-base/Fonts/FontAwesome.ttf")
    });
    this.setState({
      loading: false,
      markers: store.getState().markers,
     });
  }

  handleSearch = (text) => {
  let newState = Object.assign({}, this.state);
  newState.searchText = text;
  this.setState(newState);
  };

  render() {
    if (this.state.loading) {
      return <Expo.AppLoading />;
    }
    return (
      <ScrollView>
        <StatusBar hidden/>

        <Header searchBar rounded>
          <Item>
            <Icon name="ios-search" />
            <Input
              placeholder="Search pins"
              onChangeText={ (search) => this.handleSearch(search)}
            />
          </Item>
          <Button transparent>
            <Text>Search</Text>
          </Button>
        </Header>

        <Content padder>
          {this.state.markers.filter(
            marker => marker.name.toLowerCase()
            .includes(this.state.searchText.toLowerCase()))
            .map((marker, index) => (
              <Card
                key={marker.key}
              >
                <CardItem  button header bordered>
                  <Icon active type='Entypo' name='location-pin' />
                  <Text style={{fontWeight: '300', fontSize: 15}}>{marker.name}</Text>
                  <Text style={{position: 'absolute', right: 15, fontWeight: 'bold'}}>{marker.type}</Text>
                </CardItem>

                <CardItem  bordered>
                  <Icon active name='time' />
                  <Text style={{fontWeight: 'bold'}}>Start Time: </Text>
                  <Text>{marker.startTime}</Text>
                  <Text style={{fontWeight: 'bold', paddingLeft: 15}}>End Time: </Text>
                  <Text>{marker.endTime}</Text>
                </CardItem>

                <CardItem  bordered>
                  <Body>
                    <Text style={{fontWeight: 'bold'}}>Description: </Text>
                    <Text>{marker.description}</Text>
                  </Body>
                </CardItem>

                <CardItem  bordered>
                  <Icon active type='FontAwesome' name='user-o' />
                  <Text>{marker.placedBy}</Text>
                </CardItem>

              </Card>
          ))}
        </Content>
      </ScrollView>
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
