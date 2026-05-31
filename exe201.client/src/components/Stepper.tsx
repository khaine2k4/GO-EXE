import { Children, type ReactNode, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import './Stepper.css'

type StepperProps = {
  children: ReactNode
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void | Promise<void>
  backButtonText?: string
  nextButtonText?: string
  finalButtonText?: string
  disableStepIndicators?: boolean
  canGoNext?: (step: number) => boolean
  canEnterStep?: (step: number) => boolean
  loading?: boolean
}

export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Previous',
  nextButtonText = 'Next',
  finalButtonText = 'Finish',
  disableStepIndicators = false,
  canGoNext,
  canEnterStep,
  loading = false,
}: StepperProps) {
  const steps = useMemo(() => Children.toArray(children), [children])
  const [currentStep, setCurrentStep] = useState(() => clampStep(initialStep, steps.length))
  const totalSteps = steps.length
  const isFirst = currentStep === 1
  const isLast = currentStep === totalSteps
  const nextEnabled = !loading && (canGoNext?.(currentStep) ?? true)

  useEffect(() => {
    setCurrentStep(clampStep(initialStep, totalSteps))
  }, [initialStep, totalSteps])

  function goToStep(step: number) {
    if (disableStepIndicators) return
    if (canEnterStep && !canEnterStep(step)) return
    const nextStep = clampStep(step, totalSteps)
    setCurrentStep(nextStep)
    onStepChange?.(nextStep)
  }

  function goBack() {
    if (isFirst || loading) return
    const nextStep = currentStep - 1
    setCurrentStep(nextStep)
    onStepChange?.(nextStep)
  }

  async function goNext() {
    if (!nextEnabled) return
    if (isLast) {
      await onFinalStepCompleted?.()
      return
    }
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
    onStepChange?.(nextStep)
  }

  return (
    <div className="outer-container">
      <div className="step-circle-container">
        <div className="step-indicator-row">
          {steps.map((_, index) => {
            const stepNumber = index + 1
            const active = stepNumber === currentStep
            const complete = stepNumber < currentStep
            const enabled = !disableStepIndicators && (!canEnterStep || canEnterStep(stepNumber))

            return (
              <div key={stepNumber} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  disabled={!enabled || loading}
                  onClick={() => goToStep(stepNumber)}
                  className="step-indicator"
                  aria-label={`Step ${stepNumber}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <motion.div
                    className="step-indicator-inner"
                    animate={{
                      backgroundColor: active || complete ? '#0f172a' : '#f1f5f9',
                      color: active || complete ? '#ffffff' : '#64748b',
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {complete ? <CheckIcon /> : active ? <span className="active-dot" /> : <span className="step-number">{stepNumber}</span>}
                  </motion.div>
                </button>

                {stepNumber < totalSteps && (
                  <div className="step-connector">
                    <motion.div
                      className="step-connector-inner"
                      initial={false}
                      animate={{ width: complete ? '100%' : '0%' }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="step-content-default">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
              className="step-default"
            >
              {steps[currentStep - 1]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="footer-container">
          <div className={`footer-nav ${isFirst ? 'end' : 'spread'}`}>
            {!isFirst && (
              <button type="button" onClick={goBack} className={`back-button ${loading ? 'inactive' : ''}`}>
                {backButtonText}
              </button>
            )}
            <button type="button" onClick={goNext} disabled={!nextEnabled} className="next-button">
              {loading ? 'Đang xử lý...' : isLast ? finalButtonText : nextButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="check-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function clampStep(step: number, total: number) {
  if (total <= 0) return 1
  return Math.min(Math.max(step, 1), total)
}
