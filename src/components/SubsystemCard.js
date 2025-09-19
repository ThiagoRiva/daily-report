import React from 'react';

const SubsystemCard = React.memo(({ title, icon, subsystem, data, onUpdate }) => {
  const isOk = data.ok100;
  
  const handleRadioChange = (value) => {
    onUpdate(subsystem, 'ok100', value);
  };

  const handleInputChange = (field, value) => {
    onUpdate(subsystem, field, value);
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            isOk ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isOk ? '100%' : '< 100%'}
        </div>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Disponibilidade 100%?
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`status_${subsystem}_${Date.now()}`}
                checked={isOk}
                onChange={() => handleRadioChange(true)}
                className="mr-2"
              />
              <span className="text-sm">Sim</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`status_${subsystem}_${Date.now()}`}
                checked={!isOk}
                onChange={() => handleRadioChange(false)}
                className="mr-2"
              />
              <span className="text-sm">Não</span>
            </label>
          </div>
        </div>

        {/* Motivo e Ação (só aparece se não estiver 100%) */}
        {!isOk && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <input
                type="text"
                value={data.motivo || ''}
                onChange={(e) => handleInputChange('motivo', e.target.value)}
                placeholder="Descreva o motivo..."
                className="input-field"
                key={`motivo_${subsystem}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ação prevista
              </label>
              <input
                type="text"
                value={data.acaoPrevista || ''}
                onChange={(e) => handleInputChange('acaoPrevista', e.target.value)}
                placeholder="Descreva a ação prevista..."
                className="input-field"
                key={`acao_${subsystem}`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

SubsystemCard.displayName = 'SubsystemCard';

export default SubsystemCard;
