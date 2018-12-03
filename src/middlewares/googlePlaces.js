const request = require('request')

// Google places middleware and abstractions
module.exports = {
  /**
   * Get nearby places
   * @param {{lagitude: number, longitude: number}} coords
   * @param next
   */
  getNearbyPlaces: (coords, next) => {

    request(`https://maps.googleapis.com/maps/api/place/nearbysearch/json
          ?location=${coords.latitude},${coords.longitude}
          &radius=200
          &key=AIzaSyA_gPCjxT9J-VRn0-gO3uv5-gq2ewXR9Q0`,
      {json: true}, (response, body) => {
        if (error) throw new Error(error)

        const places = body.results.map(place => ({placeId: place.id, placeName: place.name}))

        next(places)
      })
  }
}