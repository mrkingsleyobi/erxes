import { ICustomField } from '@erxes/api-utils/src/definitions/common';
import { Schema, Document } from 'mongoose';
import { CAR_SELECT_OPTIONS } from './constants';
import { field, schemaHooksWrapper } from './utils';
import { IElement } from './element';

const getEnum = (): string[] => {
  return STATUS_TYPES.map(option => option.value);
};
const STATUS_TYPES = [
  { label: 'published', value: 'published' },
  { label: 'draft', value: 'draft' },
];

export interface ILocation {
  lat: number;
  lng: number;
  name: string;
  mapId: string;
}
export interface GroupDay {
  day: number;
  images: string[];
  content: string;
  elements: ElementItem[];
}
export interface ElementItem {
  elementId: string;
  orderOfDay: number;
}
export interface IItinerary {
  name: string;
  content: string;
  duration: number;
  groupDays: GroupDay[];
  location: ILocation[];
  images: String[];
  status: String;
}

export interface IItineraryDocument extends IItinerary, Document {
  _id: string;
  createdAt: Date;
  modifiedAt: Date;
  ownerId: string;
  searchText: string;
}

export const locationSchema = new Schema(
  {
    lat: field({ type: Number, esType: 'lat' }),
    lng: field({ type: Number, esType: 'lng' }),
    name: field({ type: String, label: 'name' }),
    mapId: field({ type: String, label: 'mapId' }),
  },
  { _id: false }
);
const elementOfItinerarySchema = new Schema(
  {
    elementId: field({ type: String, label: 'elementId' }),
    orderOfDay: field({ type: Number, label: 'orderOfDay' }),
  },
  { _id: false }
);

const groupDay = new Schema(
  {
    day: field({ type: Number, label: 'day' }),
    images: field({ type: [String], label: 'images' }),
    content: field({ type: String, label: 'content' }),
    elements: field({ type: [elementOfItinerarySchema], label: 'elements' }),
  },
  { _id: false }
);

export const initnarySchema = schemaHooksWrapper(
  new Schema({
    _id: field({ pkey: true }),
    createdAt: field({ type: Date, label: 'Created at' }),
    modifiedAt: field({ type: Date, label: 'Modified at' }),

    name: field({ type: String, optional: true, label: 'name' }),
    content: field({ type: String, optional: true, label: 'content' }),
    duration: field({ type: Number, optional: true, label: 'number' }),
    groupDays: field({
      type: [groupDay],
      optional: true,
      label: 'days',
    }),
    location: field({
      type: [locationSchema],
      optional: true,
      label: 'location',
    }),
    images: field({ type: [String], optional: true, label: 'images' }),
    status: field({
      type: String,
      enum: getEnum(),
      default: '',
      optional: true,
      label: 'status',
      esType: 'keyword',
      selectOptions: STATUS_TYPES,
    }),
  }),
  'erxes_itineraries'
);
