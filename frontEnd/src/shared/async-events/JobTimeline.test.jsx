import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JobTimeline } from './JobTimeline.jsx';

describe('JobTimeline', () => {
  it('shows safe user messages in sequence order without fake percent or technical codes', () => {
    render(<JobTimeline events={[
      {
        jobId: 'job-1', sequence: 2, status: 'COMPLETED',
        messageKey: 'job.idea.questions.completed', occurredAt: '2026-08-05T00:00:01Z',
        technicalCode: 'INTERNAL_DIAGNOSTIC',
      },
      {
        jobId: 'job-1', sequence: 1, status: 'RUNNING',
        messageKey: 'job.idea.attachment.parsing.started', occurredAt: '2026-08-05T00:00:00Z',
      },
    ]} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('첨부파일');
    expect(items[1]).toHaveTextContent('추가 확인');
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/INTERNAL_DIAGNOSTIC/)).not.toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite');
  });

  it('maps boundary blocked events without exposing technical codes', () => {
    render(<JobTimeline events={[{ sequence: 1, status: 'BLOCKED', messageKey: 'job.boundary.blocked',
      technicalCode: 'BOUNDARY_INTERNAL' }]} />);
    expect(screen.getByText('고정 조건과 규제 경계가 충돌합니다.')).toBeInTheDocument();
    expect(screen.getByText('수정 필요')).toBeInTheDocument();
    expect(screen.queryByText('BOUNDARY_INTERNAL')).not.toBeInTheDocument();
  });
});
