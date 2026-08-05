import { useId } from 'react';

import { jobEventMessage } from './jobEventMessages.js';
import './jobTimeline.css';

export function JobTimeline({ events = [], title = '작업 진행 상황' }) {
  const titleId = useId();
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence);
  return (
    <section className="job-timeline" aria-labelledby={titleId}>
      <h3 id={titleId} className="job-timeline__title">{title}</h3>
      <ol className="job-timeline__list" aria-live="polite">
        {ordered.map((event) => (
          <li className="job-timeline__item" key={`${event.jobId}-${event.sequence}`}>
            <span className={`job-timeline__state job-timeline__state--${event.status?.toLowerCase()}`}>
              {statusLabel(event.status)}
            </span>
            <span className="job-timeline__message">{jobEventMessage(event)}</span>
            <time className="job-timeline__time" dateTime={event.occurredAt}>
              {formatTime(event.occurredAt)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function statusLabel(status) {
  return ({
    QUEUED: '대기',
    RUNNING: '진행 중',
    COMPLETED: '완료',
    FAILED: '오류',
    NEEDS_INPUT: '확인 필요',
  })[status] ?? '업데이트';
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
