import React from 'react';
import { Home, Tag, DoorOpen, MapPin, FileText, Mail, Phone, Info, Calendar, Building, DollarSign } from 'lucide-react';

interface FormIconProps {
  name?: string;
  className?: string;
}

export const FormIcon: React.FC<FormIconProps> = ({ name, className = "w-5 h-5 text-gray-700" }) => {
  switch (name?.toLowerCase()) {
    case 'home':
    case 'house':
      return <Home className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'door':
    case 'room':
      return <DoorOpen className={className} />;
    case 'map':
    case 'location':
      return <MapPin className={className} />;
    case 'document':
    case 'file':
      return <FileText className={className} />;
    case 'mail':
    case 'email':
      return <Mail className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'building':
      return <Building className={className} />;
    case 'price':
    case 'money':
      return <DollarSign className={className} />;
    default:
      return <Info className={className} />;
  }
};