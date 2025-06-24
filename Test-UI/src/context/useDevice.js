import { useContext } from 'react';
import DeviceContext from './Temp';

const useDevice = () => useContext(DeviceContext);

export default useDevice;
