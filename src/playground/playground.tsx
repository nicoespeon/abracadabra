type Props = {
  className: string;
  id: string;
  style: { marginLeft: number };
};

const MyComp = ({ className, id, style }: Props) => {
  return <div id={id} style={style} className="font-semibold bg-gray-900" />;
};
