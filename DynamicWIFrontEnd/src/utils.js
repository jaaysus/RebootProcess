export const getColorHex = (code) => {
  const map = {
    'BK': '#000000', 
    'BU': '#0000FF', 
    'BN': '#8B4513', 
    'YE': '#FFFF00', 
    'GN': '#008000', 
    'VT': '#8F00FF', 
    'RD': '#FF0000', 
    'WH': '#FFFFFF', 
  };
  const primary = code.split('/')[0];
  return map[primary] || '#808080';
};