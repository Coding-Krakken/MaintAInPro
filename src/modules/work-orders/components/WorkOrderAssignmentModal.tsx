import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import {
  useWorkOrderAssignment,
  useAssignmentCriteria,
} from '../hooks/useWorkOrderAssignment';
import { WorkOrderPriority, WorkOrder } from '../types/workOrder';
import {
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface WorkOrderAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  onAssignmentComplete?: (assignedTechnician: string) => void;
}

export const WorkOrderAssignmentModal: React.FC<
  WorkOrderAssignmentModalProps
> = ({ isOpen, onClose, workOrder, onAssignmentComplete }) => {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [manualSkills, setManualSkills] = useState<string>('');
  const [manualCertifications, setManualCertifications] = useState<string>('');
  const [assignmentReason, setAssignmentReason] = useState<string>('');

  const { createCriteria } = useAssignmentCriteria();
  const {
    getRecommendations,
    assignWorkOrder,
    autoAssignWorkOrder,
    isAssigning,
    isGettingRecommendations,
    assignmentError,
  } = useWorkOrderAssignment();

  // Create assignment criteria
  const createCriteriaFromState = () => {
    const options: {
      skills?: string[];
      certifications?: string[];
      estimatedHours?: number;
      equipmentId?: string;
    } = {};

    if (manualSkills) {
      const skills = manualSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (skills.length > 0) options.skills = skills;
    }

    if (manualCertifications) {
      const certifications = manualCertifications
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
      if (certifications.length > 0) options.certifications = certifications;
    }

    if (workOrder.estimated_hours)
      options.estimatedHours = workOrder.estimated_hours;
    if (workOrder.equipment_id) options.equipmentId = workOrder.equipment_id;

    return createCriteria(workOrder.priority, options);
  };

  const criteria = createCriteriaFromState();

  // Get recommendations when modal opens
  useEffect(() => {
    if (isOpen && showRecommendations) {
      getRecommendations.mutate({ criteria, limit: 5 });
    }
  }, [isOpen, showRecommendations, criteria, getRecommendations]); // Added missing dependencies

  const handleAutoAssign = async () => {
    try {
      const result = await autoAssignWorkOrder.mutateAsync({
        workOrderId: workOrder.id,
        criteria,
        assignedBy: 'current-user', // TODO: Get from auth context
      });

      if (result) {
        onAssignmentComplete?.(result.assigned_to!);
        onClose();
      } else {
        // Auto-assignment failed, show manual recommendations
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Auto-assignment failed:', error);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedTechnicianId) return;

    try {
      await assignWorkOrder.mutateAsync({
        workOrderId: workOrder.id,
        technicianId: selectedTechnicianId,
        assignedBy: 'current-user', // TODO: Get from auth context
      });

      onAssignmentComplete?.(selectedTechnicianId);
      onClose();
    } catch (error) {
      console.error('Manual assignment failed:', error);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const recommendations = getRecommendations.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Assign Work Order'>
      <div className='space-y-6'>
        {/* Work Order Summary */}
        <Card className='p-4 bg-gray-50'>
          <h3 className='text-lg font-semibold mb-2'>{workOrder.title}</h3>
          <div className='flex items-center gap-4 text-sm text-gray-600'>
            <Badge
              variant={
                workOrder.priority === WorkOrderPriority.CRITICAL
                  ? 'destructive'
                  : 'default'
              }
            >
              {workOrder.priority}
            </Badge>
            {workOrder.estimated_hours && (
              <div className='flex items-center gap-1'>
                <ClockIcon className='h-4 w-4' />
                {workOrder.estimated_hours}h estimated
              </div>
            )}
            {workOrder.equipment_id && (
              <div className='flex items-center gap-1'>
                <WrenchScrewdriverIcon className='h-4 w-4' />
                Equipment: {workOrder.equipment_id}
              </div>
            )}
          </div>
        </Card>

        {/* Assignment Criteria */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='manual-skills'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Required Skills (comma-separated)
            </label>
            <Input
              id='manual-skills'
              value={manualSkills}
              onChange={e => setManualSkills(e.target.value)}
              placeholder='e.g., Electrical, Hydraulic, PLC'
            />
          </div>
          <div>
            <label
              htmlFor='manual-certifications'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Required Certifications (comma-separated)
            </label>
            <Input
              id='manual-certifications'
              value={manualCertifications}
              onChange={e => setManualCertifications(e.target.value)}
              placeholder='e.g., Electrical License, Safety Cert'
            />
          </div>
        </div>

        {/* Auto-Assignment Option */}
        <Card className='p-4 border-2 border-blue-200 bg-blue-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <SparklesIcon className='h-6 w-6 text-blue-600' />
              <div>
                <h4 className='font-semibold text-blue-900'>
                  Smart Auto-Assignment
                </h4>
                <p className='text-sm text-blue-700'>
                  Let AI find the best technician based on skills, availability,
                  and workload
                </p>
              </div>
            </div>
            <Button
              onClick={handleAutoAssign}
              disabled={autoAssignWorkOrder.isPending}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {autoAssignWorkOrder.isPending ? (
                <ArrowPathIcon className='h-4 w-4 animate-spin' />
              ) : (
                'Auto-Assign'
              )}
            </Button>
          </div>
        </Card>

        {/* Manual Assignment Recommendations */}
        {showRecommendations && (
          <div>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-lg font-semibold'>Recommended Technicians</h4>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  getRecommendations.mutate({ criteria, limit: 5 })
                }
                disabled={isGettingRecommendations}
              >
                {isGettingRecommendations ? (
                  <ArrowPathIcon className='h-4 w-4 animate-spin' />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>

            {isGettingRecommendations ? (
              <div className='text-center py-4'>
                <ArrowPathIcon className='h-8 w-8 animate-spin mx-auto text-gray-400' />
                <p className='text-gray-500 mt-2'>
                  Finding best technicians...
                </p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className='space-y-3'>
                {recommendations.map(rec => (
                  <Card
                    key={rec.technician_id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedTechnicianId === rec.technician_id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTechnicianId(rec.technician_id!)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <UserIcon className='h-8 w-8 text-gray-400' />
                        <div>
                          <h5 className='font-semibold'>
                            {rec.assigned_technician?.full_name ||
                              'Unknown Technician'}
                          </h5>
                          <p className='text-sm text-gray-600'>
                            {rec.assigned_technician?.email}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            <div
                              className={`w-2 h-2 rounded-full ${getConfidenceColor(rec.confidence_score)}`}
                            />
                            <span className='text-sm text-gray-500'>
                              {rec.confidence_score}% match
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <Badge variant='secondary'>
                          Score: {rec.confidence_score}
                        </Badge>
                        <div className='text-xs text-gray-500 mt-1'>
                          {rec.reasons.slice(0, 2).map((reason, i) => (
                            <div key={i}>{reason}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className='p-6 text-center'>
                <ExclamationTriangleIcon className='h-12 w-12 text-yellow-500 mx-auto mb-2' />
                <h5 className='font-semibold text-gray-900 mb-1'>
                  No Recommendations Available
                </h5>
                <p className='text-gray-600 text-sm'>
                  No technicians match the current criteria. Try adjusting
                  requirements or assign manually.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Assignment Reason */}
        {selectedTechnicianId && (
          <div>
            <label
              htmlFor='assignment-reason'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Assignment Reason (Optional)
            </label>
            <Textarea
              id='assignment-reason'
              value={assignmentReason}
              onChange={e => setAssignmentReason(e.target.value)}
              placeholder='Reason for this assignment choice...'
              rows={3}
            />
          </div>
        )}

        {/* Error Display */}
        {assignmentError && (
          <Card className='p-4 bg-red-50 border-red-200'>
            <div className='flex items-center gap-2 text-red-700'>
              <ExclamationTriangleIcon className='h-5 w-5' />
              <span className='font-medium'>Assignment Failed</span>
            </div>
            <p className='text-red-600 text-sm mt-1'>
              {assignmentError.message}
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className='flex items-center justify-end gap-3 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleManualAssign}
            disabled={!selectedTechnicianId || isAssigning}
            className='min-w-32'
          >
            {isAssigning ? (
              <>
                <ArrowPathIcon className='h-4 w-4 animate-spin mr-2' />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircleIcon className='h-4 w-4 mr-2' />
                Assign Work Order
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
