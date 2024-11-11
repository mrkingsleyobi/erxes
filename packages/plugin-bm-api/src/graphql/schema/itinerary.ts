import gql from 'graphql-tag';

export const types = () => `
  
  type ElementItem {
    elementId: String
    element: Element
    orderOfDay: Int
  }
  type DayItem {
    day: Int
    images: [String]
    content: String
    elements: [ElementItem]
  }
  type Itinerary {
    _id: String!
    name: String
    content: String
    duration: Int
    groupDays :[DayItem]
    location: [BMSLocation]
    images: [String]
    status: String
    createdAt: Date
    modifiedAt: Date
  }
  input ElementItemInput {
    elementId: String
    orderOfDay: Int
  }
  input DayItemInput {
    day: Int
    images: [String]
    content: String
    elements: [ElementItemInput]
  }


  enum STATUS {
    published
    draft
  }
  type ListItinerary {
    list: [Itinerary]
    total: Int
  }
`;

export const queries = `
  bmItineraries( page:Int, perPage:Int): ListItinerary
  bmItineraryDetail(_id:String!): Itinerary
`;

const params = `
  name: String,
  content: String,
  duration: Int,
  groupDays: [DayItemInput],
  location: [BMSLocationInput],
  images: [String]
  status: STATUS
`;

export const mutations = `
  bmItineraryAdd(${params}): Itinerary
  bmItineraryRemove(ids: [String]): JSON
  bmItineraryEdit(_id:String!, ${params}): Itinerary

`;
