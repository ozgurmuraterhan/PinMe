import React, { Component } from 'react';
import 'react-native-gesture-handler';
import { View, Dimensions, ActivityIndicator, StatusBar, Alert, Platform, ScrollView, Image, Modal as ImageModal, Picker, PickerIOS} from 'react-native';
import { Container, Text, Icon, Fab, Label, Button} from 'native-base';
import FlashMessage, { showMessage, hideMessage } from "react-native-flash-message";
import TimeAgo from 'react-native-timeago';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Col, Row, Grid } from 'react-native-easy-grid';
import Modal from "react-native-modalbox";
import ActionButton from 'react-native-action-button';
import { Popup } from 'react-native-map-link';
import MapView, { Marker, ProviderPropType } from 'react-native-maps';
import Expo, {Location, Calendar, Permissions} from 'expo';
import { StackActions, NavigationActions } from 'react-navigation';
import GestureHandler from 'react-native-gesture-handler';
import { TouchableHighlight } from 'react-native';
import geolib from 'geolib'

import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import Amplify from '@aws-amplify/core'
import API, { graphqlOperation } from '@aws-amplify/api'
import { Auth, Storage } from 'aws-amplify'
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import {onCreatePin, onDeletePin} from '../../graphql/subscriptions';
import aws_config from '../../../aws-exports'
Amplify.configure(aws_config);
import gql from 'graphql-tag';

import styles from './map.style.js';
import myMapStyle from './mapstyle';
import redPin from '../../../assets/pin_red.png'
import {store} from '../../../App'

const { width, height } = Dimensions.get('window');

var _mapView: MapView;
let onCreateSubscription;
let onDeleteSubscription;

export default class MapScreen extends Component {
  constructor(props){
    super(props);

    this.state = {
      isVisible: false,
      imageViewer: false,
      imageList: [],
      currMarker: {},
      myMarkers: [],
      myCalendars: [{id: '123', name: 'Test calendar'}],
      bottom: 1,
      loading: true,
      active: false,
      active1: false,
      margin_onClick: false,
      calendarModalVisible: false,
      calendarModalLoading: false
    };

    this.getInitialState.bind(this);
    this._getLocationAsync.bind(this);
    this.closeImageViewer = this.closeImageViewer.bind(this);
  }

  async componentDidMount(){
    await Expo.Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf"),
      Entypo: require("@expo/vector-icons/fonts/Entypo.ttf"),
      FontAwesome: require("native-base/Fonts/FontAwesome.ttf"),
    });

    this.client = new AWSAppSyncClient({
      url: aws_config.aws_appsync_graphqlEndpoint,
      region: aws_config.aws_appsync_region,
      auth: {
        type: aws_config.aws_appsync_authenticationType,
        jwtToken: async () => {
          return (await Auth.currentSession()).getAccessToken().getJwtToken();
        }
      }
    });

    this.trySubscription();
    this.tryDeleteSubscription();
  }

  async trySubscription(){
    onCreateSubscription = this.client.subscribe({ query: gql(onCreatePin) }).subscribe({
      next: async data => {
        // console.log('Subscription - New Pin Created: ', data.data.onCreatePin);
        let pin = data.data.onCreatePin;
        if (store.state.currentUser === pin.userId) {
          this.loadPins();
        } else {
          let pinDistance = geolib.getDistance(
            {latitude: pin.latitude, longitude: pin.longitude},
            {latitude: store.state.userLocation.latitude, longitude: store.state.userLocation.longitude}
          );
          console.log('New Pin Distance:', pinDistance);
          if(pinDistance <= 1609){
            showMessage({
              message: "New Pin Created Near You!",
              description: `${pin.eventName} by ${pin.userId}`,
              type: "default",
              duration: "8000",
              backgroundColor: "#03a9f4", // background color
              color: "white", // text color
              onPress: () => {
                hideMessage();
              },
            });
          }
          this.loadPins();
        }
      },
      error: error => {
        console.warn('Subscription Error: ', error);
      }
    });
  }

  async tryDeleteSubscription(){
    onDeleteSubscription = this.client.subscribe({ query: gql(onDeletePin) }).subscribe({
      next: async data => {
        // console.log('Subscription - Pin Deleted: ', data.data.onDeletePin);
        let pin = data.data.onDeletePin;
        this.loadPins();
      },
      error: error => {
        console.log('Subscription - onDeletePin Error: ', error);
      }
    });
  }

  async componentWillMount(){
    this.loadPins();
  }

  componentWillUnmount() {
    onCreateSubscription.unsubscribe();
    onDeleteSubscription.unsubscribe();
  }

  async addEventToCalendar(){
    let id = 'E0E5FDBB-16EB-478F-88D3-4BC1C545EBF4';
    await Calendar.createEventAsync(id, {
      title: this.state.currMarker.name,
      startDate: this.state.currMarker.startTime,
      endDate: this.state.currMarker.endTime,
      notes: `${this.state.currMarker.description} \n\nEvent created by ${this.state.currMarker.placedBy}. \nProvided by PinMe.`,
    }).then(response => {
      Alert.alert(`Event Saved`, `Added '${this.state.currMarker.name}' to 'Home' calendar: `);
      console.log(`Added '${this.state.currMarker.name}' to 'Home' calendar: `, response);
    }).catch(err => {
      Alert.alert('Event Saving Error', err);
      console.log("Couldn't create event: ", err);
    })
  }

  async getCalendars(){

    // this.setState({
    //   calendarModalVisible: true,
    //   calendarModalLoading: true
    // });

    let { status } = await Permissions.askAsync(Permissions.CALENDAR);
    console.log("Calendar permissions status: "+status);

    let calendarList = [];
    let myCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    myCalendars.forEach(calendar => {
      calendarList.push({
        id: calendar.id,
        name: calendar.title
      })
    });

    console.log("Got calendars: ", calendarList);

    // this.setState({
    //   myCalendars: calendarList,
    //   calendarModalLoading: false
    // })
  }

  getInitialState() {
    return {
      latitude: store.state.region.latitude,
      longitude: store.state.region.longitude,
      latitudeDelta: store.state.region.latitudeDelta,
      longitudeDelta: store.state.region.longitudeDelta,
    };
  }

  _getLocationAsync = async () => {
    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
    let userLocation = {
      latitude: this.state.location.coords.latitude,
      longitude: this.state.location.coords.longitude,
    };
    console.log(JSON.stringify(userLocation));
    _mapView.animateToCoordinate(userLocation, 1000);
  };

  loadPins = async () => {
    store.update({markers: []});
    const allPins = await API.graphql(graphqlOperation(queries.listPins, {limit: 100}));
    // console.log(allPins.data.listPins.items)
    allPins.data.listPins.items.map(pin => (
      // console.log()
      store.update({
        markers: [
          ...store.state.markers,
          {
            createdAt: pin.createdAt,
            name: pin.eventName,
            hasImage: pin.hasImage,
            cognitoId: pin.userCognitoId,
            description: pin.description,
            key: pin.id,
            placedBy: pin.userId,
            type: pin.eventType,
            startTime: new Date(pin.startTime),
            endTime: new Date(pin.endTime),
            coordinate: {
              latitude: Number(pin.latitude),
              longitude: Number(pin.longitude)
            },
          }
        ]
      })
    ))
    this.setState({loading: false});
    console.log('All pins loaded!');
  }

  deletePin = async (id, image) => {
    await API.graphql(graphqlOperation(mutations.deletePin, {input: {id}}))
      .then(res => {
        if(image){
          Storage.remove(id+'.jpg', {level: 'protected'})
            .then(result => console.log("Deleting pin image: ", result))
            .catch(err => console.log("Deleting pin image encountered an error: ", err));
        }
        var removeIndex = store.getState().markers.map(function(item) { return item.key; }).indexOf(id);
        store.update(s => {
          s.markers.splice(removeIndex, 1);
        });
        this.forceUpdate();
      })
      .catch(err => {
        console.log("Deleting Pin encountered an error: ", err);
      });

  };

  static navigationOptions = {
    header: null,
    tabBarHidden: true,
  };

  toolbarHack = () => {
    if(this.state.bottom === 1){
      this.setState({bottom: 0})
    }
  };

  mapLink = (coords, name) => {
    store.update({pinLink: {
      name: name,
      latitude: coords.latitude,
      longitude: coords.longitude
    }})
  };

  openModal = () => this.setState({ visible: true });
  closeModal = () => this.setState({ visible: false });

  closeCalendarModal = () => this.setState({calendarModalVisible: false});

  iconImage () {
    switch (this.state.currMarker.type) {
      case "Accident":
        return <Icon  style={{color: '#03a9f4', fontSize: 50, left: 15}} active type="FontAwesome" name='warning'/>;
      case "Food":
        return <Icon style={{color: '#03a9f4', fontSize: 60, left: 15}} active type="Ionicons" name='ios-restaurant'/>;
      case "Social":
        return <Icon style={{color: '#03a9f4', fontSize: 60, left: 15}} active type="Ionicons" name='ios-people'/>;
      case "Study":
        return <Icon style={{color: '#03a9f4', fontSize: 40, left: 15}} active type="FontAwesome" name='book'/>;
      default:
        return <Image source={redPin} style={{transform: [{ scale: .30 }], marginLeft: 0}}/>;
    }
  }

  animateMapToMarker = (e) => {
    const coordinate = e.nativeEvent.coordinate;
    var newRegion = {
      longitudeDelta: store.state.region.longitudeDelta,
      latitudeDelta: store.state.region.latitudeDelta,
      longitude: coordinate.longitude,
      latitude: coordinate.latitude
    };
    this._map.animateToRegion(newRegion, 300) ;
  };

  animateMapToUser = () => {
    var newRegion = {
      longitudeDelta: store.state.region.longitudeDelta,
      latitudeDelta: store.state.region.latitudeDelta,
      longitude: store.state.userLocation.longitude,
      latitude: store.state.userLocation.latitude
    };
    this.setState({offUserLocation: false});
    this._map.animateToRegion(newRegion, 300) ;
  };

  getImage(pinId, id){
    Storage.get(pinId+'.jpg', {
        level: 'protected',
        identityId: id // the identityId of that user
    })
    .then(result => {
      let imageList = [];
      imageList.push({url: result});
      // console.log('Got image: ', result);
      this.setState({
        currMarkerImage: result,
        imageList
      });
    })
    .catch(err => {
      console.log('Could not get image from AWS', err)
    });
  }

  closeImageViewer(){
    this.setState({
      imageViewer: false
    })
  }

  render() {
    if (this.state.loading) {
      return <Expo.AppLoading />;
    }
    if (this.state.margin_onClick === true) {
      margin_gap = 60;
    } else {
      margin_gap = 0;
    }
    return (
    <Container style={styles.mapContainer}>
      <StatusBar hidden={Platform.OS !== 'ios'} />
      <View style={styles.mapContainer}>
        <MapView
          provider={this.props.provider}
          ref = {(ref)=>this._map=ref}
          customMapStyle={myMapStyle}
          style={[styles.mapContainer, {bottom: this.state.bottom}]}
          onPress={() => this.setState({ margin_onClick: false})}
          onRegionChange={(region) => {
            store.update({region});
          }}
          region={store.state.region}
          showsCompass={false}
          toolbarEnabled={true}
          loadingEnabled={true}
          showsUserLocation={true}
        >

        {store.state.markers.map((marker, index) => (
          <Marker
          margin_onClick={this.state.margin_onClick}
            key={marker.key}
            title={marker.name}
            description={marker.placedBy}
            coordinate={marker.coordinate}
            image={redPin}
            onCalloutPress={async () => {
              this.setState({currMarker: marker});
              this.getImage(marker.key, marker.cognitoId);
              this.openModal();
            }} // change isVisible to modalMaker to allow modal
            onPress={e => {
              this.animateMapToMarker(e);
              this.mapLink(e.nativeEvent.coordinate, marker.name);
              this.setState({
                currMarker: marker,
                nameLength: marker.name.length,
                margin_onClick: true
              });
              this.toolbarHack();
            }}
          />
        ))}

        </MapView>

        {Platform.OS === 'ios' ? <Icon style={{fontSize: 35, color: '#03a9f4', position: 'absolute', top: 60, right: 20}} onPress={() => this.animateMapToUser()} name="compass" type="Entypo" /> : null}

        <Popup
          isVisible={this.state.isVisible}
          onCancelPressed={() => this.setState({ isVisible: false })}
          onAppPressed={() => this.setState({ isVisible: false })}
          onBackButtonPressed={() => this.setState({ isVisible: false })}
          appsWhiteList={['uber', 'lyft', 'waze', 'google-maps', 'apple-maps']}
          options={{
            latitude: store.state.pinLink.latitude,
            longitude: store.state.pinLink.longitude,
            title: store.state.pinLink.name,
            dialogTitle: 'What app do you want to open?',
            cancelText: 'Cancel'
          }}
        />

        <Modal
          style={styles.pinModal}
          swipeToClose={true}
          swipeArea={20} // The height in pixels of the swipeable area, window height by default
          swipeThreshold={50} // The threshold to reach in pixels to close the modal
          isOpen={this.state.visible}
          onClosed={this.closeModal}
          backdropOpacity={0.3}
        >
            <Grid>
            <Row size={2} style={{alignItems: 'center'}}>
              {this.iconImage()}
              <Text numberOfLines={2} style={styles.pinModalTitle}>
                {this.state.currMarker.name}
              </Text>
            </Row>
            <Col size={7}>
            <ScrollView scrollEnabled={true}>
              <Label style={styles.pinModalLabel}>Time Posted: <TimeAgo time={this.state.currMarker.createdAt} style={{fontSize: 16, color: 'black'}}/></Label>
              <Label style={styles.pinModalLabel}>Start Time: <Text style={{fontSize: 16, color: 'black'}}>{this.state.currMarker.startTime ? this.state.currMarker.startTime.toLocaleString() : null}</Text></Label>
              <Label style={styles.pinModalLabel}>End Time: <Text style={{fontSize: 16, color: 'black'}}>{this.state.currMarker.endTime ? this.state.currMarker.endTime.toLocaleString() : null}</Text></Label>
              <Label style={styles.pinModalLabel}>Description</Label>
              <Text style={styles.pinModalDescription}> {this.state.currMarker.description} </Text>
              {this.state.currMarker.hasImage === true ? <Label style={styles.pinModalLabel}>Image</Label> : null}
              {this.state.currMarkerImage !== undefined ?
                <TouchableHighlight
                  style={{top: 15}}
                onPress={() => {
                  this.setState({imageViewer: true});
                }}
                >
                  <Image source={{uri: this.state.currMarkerImage}} style={styles.pinModalImage}/>
                </TouchableHighlight>
                :
                null}
            </ScrollView>
            </Col>
              <Row size={1} style={{alignItems: 'center', justifyContent: 'space-between'}}>
                {this.state.currMarker.placedBy == store.state.currentUser ?
                  <Icon onPress={() => {
                    Alert.alert(
                      `Deleting Pin`,
                      `Are you sure you want to delete the pin '${this.state.currMarker.name}?'`,
                      [
                        {text: 'OK', onPress: () => {
                          this.deletePin(this.state.currMarker.key, this.state.currMarker.hasImage);
                          this.closeModal();
                        }},
                        {text: 'Cancel', onPress: () => {return}, style: 'cancel'},
                      ]
                    );
                  }}
                  style={styles.pinModalTrash} name="trash-o" type="FontAwesome"/> :
                  <Label style={{left: 15, fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Light' : 'sans-serif-light'}}>{this.state.currMarker.placedBy} </Label>
                }
                <Icon name="calendar-plus-o" type="FontAwesome" style={{fontSize: 30, color: "#03a9f4", left: 10}} onPress={() => {
                  Alert.alert(
                    'Saving Event',
                    'Do you want to save this event?',
                    [
                      {text: 'OK', onPress: () => {
                          this.addEventToCalendar();
                        }},
                      {text: 'Cancel', onPress: () => {return}, style: 'cancel'},
                    ]
                  );
                }}/>
                <Icon style={{fontSize: 40, color: "#03a9f4", right: 10}} name="ios-navigate" type="Ionicons" onPress={() => {
                    this.closeModal();
                    setTimeout(() => {this.setState({isVisible: true});}, 400);
                  }}/>
              </Row>
            </Grid>
        </Modal>

        <View style = {styles.mapDrawerOverlay} />

        <View style={{ flex: 1, position: 'absolute'}}>
          <Fab
            active1={this.state.active1}
            containerStyle={{ }}
            style={{ backgroundColor: '#03a9f4' , top: Platform.OS === 'ios' ? 30 : 0}}
            position="topLeft"
            onPress={() => this.props.navigation.openDrawer()}>
            <Icon name="menu" />
          </Fab>
        </View>

        <ActionButton
        buttonColor="#03a9f4"
        backgroundTappable={true}
        fixNativeFeedbackRadius={true}
        offsetX={15}
        offsetY={15}
        >
          <ActionButton.Item size={40} buttonColor='white' title="Sign Out" onPress={() => {
            Auth.signOut();
            const resetAction = StackActions.reset({
              index: 0,
              actions: [
                NavigationActions.navigate({ routeName: 'SignIn' }),
              ],
            });
            this.props.navigation.dispatch(resetAction);
          }}>
            <Icon name="ios-arrow-back" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor='white' title="Refresh Pins" onPress={() => {this.loadPins();}}>
            <Icon name="refresh" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor='white' title="Create Pin" onPress={() => {this.props.navigation.navigate('AddPin')}}>
            <Icon name="create" style={styles.actionButtonIcon} />
          </ActionButton.Item>
        </ActionButton>

        <ImageModal visible={this.state.imageViewer}>
          <ImageViewer
            enableSwipeDown
            onCancel={this.closeImageViewer}
            imageUrls={this.state.imageList}
          />
        </ImageModal>

        <Modal
          style={styles.pinModal}
          swipeToClose={true}
          swipeArea={20} // The height in pixels of the swipeable area, window height by default
          swipeThreshold={50} // The threshold to reach in pixels to close the modal
          isOpen={this.state.calendarModalVisible}
          onClosed={this.closeCalendarModal}
          backdropOpacity={0.3}
        >
          <Button k/>
        </Modal>

        <FlashMessage ref="newPinMessage" />

      </View>
    </Container>
    );
  }
}

MapScreen.propTypes = {
  provider: ProviderPropType,
};
