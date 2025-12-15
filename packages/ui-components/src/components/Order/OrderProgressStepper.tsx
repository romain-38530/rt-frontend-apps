import React from 'react';

export interface OrderProgressStepperProps {
  status: string;
  steps?: Array<{ key: string; label: string; icon: string }>;
}

const DEFAULT_STEPS = [
  { key: 'created', label: 'Creee', icon: 'check' },
  { key: 'sent_to_carrier', label: 'Envoyee', icon: 'send' },
  { key: 'carrier_accepted', label: 'Acceptee', icon: 'thumbsup' },
  { key: 'in_transit', label: 'Transit', icon: 'truck' },
  { key: 'arrived_delivery', label: 'Arrive', icon: 'target' },
  { key: 'delivered', label: 'Livree', icon: 'star' },
  { key: 'closed', label: 'Cloturee', icon: 'lock' },
];

const STATUS_MAPPING: Record<string, string> = {
  draft: 'created',
  pending: 'created',
  arrived_pickup: 'in_transit',
  loaded: 'in_transit',
};

export const OrderProgressStepper: React.FC<OrderProgressStepperProps> = ({
  status,
  steps = DEFAULT_STEPS,
}) => {
  const mappedStatus = STATUS_MAPPING[status] || status;
  const currentIndex = steps.findIndex((s) => s.key === mappedStatus);

  const getProgressWidth = () => {
    if (currentIndex <= 0) return '0%';
    return `${(currentIndex / (steps.length - 1)) * 100}%`;
  };

  return (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          {/* Ligne de fond */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '60px',
              right: '60px',
              height: '3px',
              backgroundColor: '#e5e7eb',
              zIndex: 0,
            }}
          />
          {/* Ligne de progression */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '60px',
              height: '3px',
              backgroundColor: '#667eea',
              zIndex: 1,
              width: getProgressWidth(),
              transition: 'width 0.5s ease',
            }}
          />

          {/* Etapes */}
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#22c55e' : isCurrent ? '#667eea' : '#e5e7eb',
                    color: isCompleted || isCurrent ? 'white' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    border: isCurrent ? '3px solid #c7d2fe' : 'none',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(102, 126, 234, 0.2)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    fontWeight: isCurrent ? '700' : '500',
                    color: isCompleted ? '#22c55e' : isCurrent ? '#667eea' : '#9ca3af',
                    textAlign: 'center',
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderProgressStepper;
