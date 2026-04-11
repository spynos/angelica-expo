import {
  Blocks,
  Book,
  BookOpen,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  Heart,
  Home,
  LayoutGrid,
  Lightbulb,
  List,
  Pencil,
  Plus,
  Send,
  Settings,
  SquarePen,
  Trophy,
  Undo2,
  User,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { type StyleProp, type ViewStyle } from 'react-native';

type Entry = { Icon: LucideIcon; filled?: boolean };

const MAPPING = {
  'house.fill': { Icon: Home },
  'paperplane.fill': { Icon: Send },
  'chevron.left.forwardslash.chevron.right': { Icon: Code },
  'chevron.right': { Icon: ChevronRight },
  'chevron.left': { Icon: ChevronLeft },
  'square.and.pencil': { Icon: SquarePen },
  'square.grid.3x3.fill': { Icon: LayoutGrid },
  pencil: { Icon: Pencil },
  'list.bullet': { Icon: List },
  trophy: { Icon: Trophy },
  'book.fill': { Icon: BookOpen },
  book: { Icon: Book },
  'puzzlepiece.fill': { Icon: Blocks },
  'person.fill': { Icon: User },
  heart: { Icon: Heart },
  'heart.fill': { Icon: Heart, filled: true },
  bookmark: { Icon: Bookmark },
  'bookmark.fill': { Icon: Bookmark, filled: true },
  'gearshape.fill': { Icon: Settings },
  plus: { Icon: Plus },
  'arrow.uturn.backward': { Icon: Undo2 },
  lightbulb: { Icon: Lightbulb },
  'pencil.tip': { Icon: Pencil },
  xmark: { Icon: X },
  checkmark: { Icon: Check },
} satisfies Record<string, Entry>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  strokeWidth = 2,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
}) {
  const entry = MAPPING[name] as Entry;
  const { Icon, filled } = entry;
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : 'none'}
      style={style}
    />
  );
}
