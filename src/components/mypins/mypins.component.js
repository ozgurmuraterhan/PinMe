import React, { Component } from 'react';
import { ScrollView, StyleSheet, Text, StatusBar, Alert, RefreshControl } from 'react-native';
import { Card, CardItem, Body, Container, Header, Content, Icon, Item, Input, } from 'native-base';
import Expo from 'expo';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import API, { graphqlOperation } from '@aws-amplify/api'
import {store} from '../../../App'

export default class MyPinsScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
        loading: true,
        markers: [],
        searchText: "",
        refreshing: false
    }
  }

  async componentDidMount() {
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf"),
      Entypo: require("native-base/Fonts/Entypo.ttf"),
      FontAwesome: require("native-base/Fonts/FontAwesome.ttf"),
      MaterialCommunityIcons: require("native-base/Fonts/MaterialCommunityIcons.ttf"),
    });
    this.loadPins();
    // console.log(store.state.currentUser);
    this.setState({loading: false});
  }

  _onRefresh = () => {
    this.setState({refreshing: true});
    this.loadPins();
  }

  deletePin = (id) => {
    const result = API.graphql(graphqlOperation(mutations.deletePin, {input: {id: id}}));
    console.log(result.data);
    var removeIndex = store.getState().markers.map(function(item) { return item.key; }).indexOf(id);
    store.update(s => {
      s.markers.splice(removeIndex, 1);
    })
    this.forceUpdate();
  }



  iconImage (marker) {
    switch (marker.type) {
      case "Accident":
        return <Icon  style={{color: '#eddd2d', position: 'absolute', right: 65,transform: [{scale: .75}]}} active type='FontAwesome' name='warning'/>;
      case "Food":
        return <Icon style={{color: '#f78640', position: 'absolute', right: 45,}} active type='MaterialCommunityIcons' name='food'/>;
      case "Social":
        return <Icon style={{color: '#ca30f4',position: 'absolute', right: 50, transform: [{scale: .75}]}} active type='FontAwesome' name='group'/>;
      case "Study":
        return <Icon style={{color: '#03a9f4',position: 'absolute', right: 45, transform: [{scale: .75}]}} active type='MaterialCommunityIcons' name='book-open-variant'/>;

    }
  }

  handleSearch = (text) => {
    let newState = Object.assign({}, this.state);
    newState.searchText = text;
    this.setState(newState);
  };

  static navigationOptions = {
    header: null,
    tabBarHidden: true,
  };

  loadPins = async () => {
    this.setState({markers: []});
    const allPins = await API.graphql(graphqlOperation(queries.listPins, {
      "filter": {
        "userId": {
          "eq": store.state.currentUser
        }
      },
      "limit": 100
    }));
    allPins.data.listPins.items.map(pin => (
      // console.log()
      this.setState({
        markers: [
          ...this.state.markers,
          {
            name: pin.eventName,
            description: pin.description,
            key: pin.id,
            placedBy: pin.userId,
            type: pin.eventType,
            startTime: pin.startTime,
            endTime: pin.endTime,
            coordinate: {
              latitude: Number(pin.latitude),
              longitude: Number(pin.longitude)
            },
          }
        ]
      })
    ))
    this.setState({loading: false});
    this.setState({refreshing: false});
    console.log('All pins loaded!');
  }

  render() {
    if (this.state.loading) {
      return <Expo.AppLoading />;
    }
    return (
      <Container>
      <Header searchBar rounded style = {{backgroundColor: '#03a9f4'}}>
        <Item>
          <Icon name="ios-search" />
          <Input
            placeholder="Search pins"
            onChangeText={ (search) => this.handleSearch(search)}
          />
        </Item>
      </Header>
      <StatusBar hidden/>
      <ScrollView
        refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
            />
          }
      >


        <Content padder>
          {this.state.markers.map((marker, index) => (
              <Card
                key={marker.key}
              >
                <CardItem  button header bordered
                onPress={() => {
                 store.update({
                    region:{
                      latitude: marker.coordinate.latitude,
                      longitude: marker.coordinate.longitude,
                      latitudeDelta: store.state.region.latitudeDelta,
                      longitudeDelta: store.state.region.longitudeDelta
                }});
                this.props.navigation.navigate('Map');
                }}>
                  <Icon style={{color: '#ed2224'}} active type='Entypo' name='location-pin' />
                  <Text style={{fontWeight: '300', fontSize: 15}}>{marker.name}</Text>
                  {this.iconImage(marker)}
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
                  <Icon
                    style={{position: 'absolute', right: 0 }}
                    type='Ionicons' name='trash'
                    onPress={() => {
                      Alert.alert(
                        `Deleting Pin`,
                        `Are you sure you want to delete the pin '${marker.name}?'`,
                        [
                          {text: 'OK', onPress: () => this.deletePin(marker.key)},
                          {text: 'Cancel', onPress: () => {return}, style: 'cancel'},
                        ]
                      );
                      console.log('Deleting pin: ', marker.name);
                    }}/>
                </CardItem>

              </Card>
          ))}
        </Content>
      </ScrollView>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
