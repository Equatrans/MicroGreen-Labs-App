import { Kit3DBuilder } from '../../components/MainApp';

export default function BuilderPage() {
  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Конфигуратор фермы</h1>
      <Kit3DBuilder />
    </div>
  );
}