import dynamic from 'next/dynamic';

const BusTrackingMap = dynamic(() => import('./BusTrackingMapComponent'), { ssr: false });

export default BusTrackingMap;
