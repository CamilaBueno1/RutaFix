import { View } from 'react-native';

const sombraArcilla = {
  shadowColor: '#64748B',
  shadowOffset: { width: 8, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 22,
  elevation: 3,
};

export function FondoClaymorphism() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View
        className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#DCEBFA]"
        style={sombraArcilla}
      />
      <View
        className="absolute -left-20 top-[34%] h-56 w-56 rotate-12 rounded-[52px] bg-[#FCEFD9]"
        style={sombraArcilla}
      />
      <View
        className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#E4EAF8]"
        style={sombraArcilla}
      />
    </View>
  );
}
