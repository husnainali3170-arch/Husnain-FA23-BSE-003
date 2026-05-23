import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  Polyline,
  Polygon,
  Callout,
  UrlTile,
  Overlay,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// ============================================
// COMPONENT 1: Basic Map with User Location
// ============================================
export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('standard');
  const [showComponents, setShowComponents] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [region, setRegion] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  
  const mapRef = useRef(null);
  const watchSubscription = useRef(null);

  // Get initial location
  useEffect(() => {
    (async () => {
      try {
        // Request foreground permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        // Get current position with high accuracy
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        
        setLocation(currentLocation);
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
        
        // Add to history
        setLocationHistory([{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          timestamp: currentLocation.timestamp,
        }]);
        
      } catch (error) {
        setErrorMsg('Could not fetch location: ' + error.message);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
    };
  }, []);

  // Toggle location tracking
  const toggleTracking = async () => {
    if (trackingEnabled) {
      // Stop tracking
      if (watchSubscription.current) {
        watchSubscription.current.remove();
        watchSubscription.current = null;
      }
      setTrackingEnabled(false);
    } else {
      // Start tracking
      setTrackingEnabled(true);
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation);
          setLocationHistory(prev => [
            ...prev,
            {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              timestamp: newLocation.timestamp,
            }
          ]);
          
          // Animate to new location
          mapRef.current?.animateToRegion({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }, 1000);
        }
      );
    }
  };

  // Recenter map to user location
  const goToUserLocation = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    }
  };

  // Generate nearby points of interest for demonstration
  const getNearbyPoints = () => {
    if (!location) return [];
    const { latitude, longitude } = location.coords;
    return [
      {
        id: 1,
        title: 'Point of Interest A',
        description: 'A nearby interesting location',
        coordinate: {
          latitude: latitude + 0.005,
          longitude: longitude + 0.005,
        },
        type: 'restaurant',
      },
      {
        id: 2,
        title: 'Point of Interest B',
        description: 'Another cool spot',
        coordinate: {
          latitude: latitude - 0.003,
          longitude: longitude - 0.004,
        },
        type: 'museum',
      },
      {
        id: 3,
        title: 'Point of Interest C',
        description: 'Check this place out',
        coordinate: {
          latitude: latitude + 0.002,
          longitude: longitude - 0.006,
        },
        type: 'park',
      },
    ];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-off" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setErrorMsg(null);
            setLoading(true);
            // Retry logic would go here
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Location Explorer</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setShowComponents(!showComponents)}
        >
          <Ionicons 
            name={showComponents ? "close" : "information-circle"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Map Component */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsTraffic={true}
          showsBuildings={true}
          showsIndoors={true}
          loadingEnabled={true}
          loadingIndicatorColor="#4A90D9"
          loadingBackgroundColor="#f0f0f0"
          rotateEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          zoomEnabled={true}
          zoomControlEnabled={true}
          moveOnMarkerPress={true}
          legalLabelInsets={{ bottom: 20, right: 20 }}
        >
          {/* User Location Marker with Custom Pin */}
          {location && (
            <>
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="You are here"
                description={`Accuracy: ${Math.round(location.coords.accuracy)}m`}
                pinColor="#4A90D9"
              >
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>📍 Your Location</Text>
                    <Text style={styles.calloutText}>
                      Lat: {location.coords.latitude.toFixed(6)}
                    </Text>
                    <Text style={styles.calloutText}>
                      Lng: {location.coords.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.calloutText}>
                      Altitude: {location.coords.altitude?.toFixed(1) || 'N/A'}m
                    </Text>
                    <Text style={styles.calloutText}>
                      Speed: {(location.coords.speed * 3.6)?.toFixed(1) || '0'} km/h
                    </Text>
                  </View>
                </Callout>
              </Marker>

              {/* Accuracy Circle */}
              <Circle
                center={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                radius={location.coords.accuracy || 50}
                strokeColor="rgba(74, 144, 217, 0.3)"
                fillColor="rgba(74, 144, 217, 0.1)"
                strokeWidth={2}
              />
            </>
          )}

          {/* Nearby Points of Interest */}
          {getNearbyPoints().map((point) => (
            <Marker
              key={point.id}
              coordinate={point.coordinate}
              title={point.title}
              description={point.description}
              onPress={() => setSelectedMarker(point)}
            >
              <View style={styles.customMarker}>
                <FontAwesome5 
                  name={
                    point.type === 'restaurant' ? 'utensils' : 
                    point.type === 'museum' ? 'landmark' : 'tree'
                  } 
                  size={16} 
                  color="#fff" 
                />
              </View>
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{point.title}</Text>
                  <Text style={styles.calloutText}>{point.description}</Text>
                  <Text style={styles.calloutType}>Type: {point.type}</Text>
                </View>
              </Callout>
            </Marker>
          ))}

          {/* Location History Path */}
          {locationHistory.length > 1 && (
            <Polyline
              coordinates={locationHistory.map(h => ({
                latitude: h.latitude,
                longitude: h.longitude,
              }))}
              strokeColor="#FF6B6B"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          )}

          {/* Example Polygon (Geofence demo) */}
          {location && (
            <Polygon
              coordinates={[
                {
                  latitude: location.coords.latitude + 0.008,
                  longitude: location.coords.longitude + 0.008,
                },
                {
                  latitude: location.coords.latitude + 0.008,
                  longitude: location.coords.longitude - 0.008,
                },
                {
                  latitude: location.coords.latitude - 0.008,
                  longitude: location.coords.longitude - 0.008,
                },
                {
                  latitude: location.coords.latitude - 0.008,
                  longitude: location.coords.longitude + 0.008,
                },
              ]}
              strokeColor="rgba(255, 107, 107, 0.8)"
              fillColor="rgba(255, 107, 107, 0.2)"
              strokeWidth={2}
            />
          )}

          {/* Custom Tile Overlay Example */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            opacity={0.0} // Set to 0.3 to show overlay
          />
        </MapView>

        {/* Floating Controls */}
        <View style={styles.controlsContainer}>
          {/* Map Type Toggle */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              const types = ['standard', 'satellite', 'hybrid', 'terrain'];
              const currentIndex = types.indexOf(mapType);
              setMapType(types[(currentIndex + 1) % types.length]);
            }}
          >
            <MaterialIcons name="layers" size={24} color="#1a1a2e" />
          </TouchableOpacity>

          {/* My Location Button */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={goToUserLocation}
          >
            <MaterialIcons name="my-location" size={24} color="#4A90D9" />
          </TouchableOpacity>

          {/* Tracking Toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              trackingEnabled && styles.trackingActive
            ]}
            onPress={toggleTracking}
          >
            <MaterialIcons 
              name={trackingEnabled ? "stop" : "play-arrow"} 
              size={24} 
              color={trackingEnabled ? "#FF6B6B" : "#4CAF50"} 
            />
          </TouchableOpacity>
        </View>

        {/* Location Info Panel */}
        {location && (
          <View style={styles.infoPanel}>
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={16} color="#4A90D9" />
              <Text style={styles.infoText}>
                {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="speedometer" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>
                {(location.coords.speed * 3.6)?.toFixed(1) || '0'} km/h
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color="#FF9800" />
              <Text style={styles.infoText}>
                {new Date(location.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Components Documentation Panel */}
      {showComponents && (
        <View style={styles.componentsPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.componentsTitle}>📚 react-native-maps Components</Text>
            
            <ComponentCard
              title="MapView"
              description="The main map container. Supports gestures, custom styling, and various map types (standard, satellite, hybrid, terrain)."
              props={['region', 'mapType', 'showsUserLocation', 'onRegionChangeComplete', 'provider']}
            />
            
            <ComponentCard
              title="Marker"
              description="Displays a clickable pin on the map. Supports custom views, callouts, drag events, and image-based icons."
              props={['coordinate', 'title', 'description', 'pinColor', 'onPress', 'draggable']}
            />
            
            <ComponentCard
              title="Callout"
              description="Info window shown when tapping a marker. Can be fully customized with custom views and styling."
              props={['tooltip', 'onPress', 'style']}
            />
            
            <ComponentCard
              title="Circle"
              description="Draws a circle on the map. Useful for showing accuracy radius, geofences, or coverage areas."
              props={['center', 'radius', 'strokeColor', 'fillColor', 'strokeWidth']}
            />
            
            <ComponentCard
              title="Polyline"
              description="Draws a line connecting multiple coordinates. Perfect for showing routes, paths, or trails."
              props={['coordinates', 'strokeColor', 'strokeWidth', 'lineDashPattern']}
            />
            
            <ComponentCard
              title="Polygon"
              description="Draws a filled shape with a border. Useful for highlighting areas, zones, or territories."
              props={['coordinates', 'strokeColor', 'fillColor', 'strokeWidth', 'holes']}
            />
            
            <ComponentCard
              title="Overlay"
              description="Places an image over the map with bound coordinates. Great for custom floor plans or historical maps."
              props={['image', 'bounds', 'opacity']}
            />
            
            <ComponentCard
              title="UrlTile / WMSTile"
              description="Adds custom tile layers from URL templates. Use for OpenStreetMap, weather layers, or custom map tiles."
              props={['urlTemplate', 'maximumZ', 'minimumZ', 'opacity']}
            />
            
            <ComponentCard
              title="Heatmap"
              description="Visualizes density of data points using color gradients. Requires google provider."
              props={['points', 'radius', 'gradient', 'opacity']}
            />
            
            <ComponentCard
              title="Geojson"
              description="Renders GeoJSON data directly. Supports Point, LineString, Polygon, and Multi geometries."
              props={['geojson', 'strokeColor', 'fillColor', 'markerComponent']}
            />
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================
// COMPONENT 2: Documentation Card Component
// ============================================
function ComponentCard({ title, description, props }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <View style={styles.propsContainer}>
        {props.map((prop, index) => (
          <View key={index} style={styles.propTag}>
            <Text style={styles.propText}>{prop}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  trackingActive: {
    backgroundColor: '#FFE5E5',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  calloutContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  calloutType: {
    fontSize: 12,
    color: '#4A90D9',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  componentsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  componentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#252545',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90D9',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  propsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  propTag: {
    backgroundColor: 'rgba(74, 144, 217, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  propText: {
    color: '#4A90D9',
    fontSize: 12,
    fontWeight: '600',
  },
});