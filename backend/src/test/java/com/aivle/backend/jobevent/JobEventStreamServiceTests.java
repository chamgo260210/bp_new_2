package com.aivle.backend.jobevent;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class JobEventStreamServiceTests {
    @Test
    void completionCallbackRemovesEmitter() {
        JobEventStreamService service = new JobEventStreamService();
        SseEmitter emitter = mock(SseEmitter.class);
        ArgumentCaptor<Runnable> callback = ArgumentCaptor.forClass(Runnable.class);
        service.subscribe("job-complete", List::of, emitter);

        verify(emitter).onCompletion(callback.capture());
        callback.getValue().run();

        assertThat(service.activeConnections()).isZero();
    }

    @Test
    void timeoutCallbackRemovesEmitter() {
        JobEventStreamService service = new JobEventStreamService();
        SseEmitter emitter = mock(SseEmitter.class);
        ArgumentCaptor<Runnable> callback = ArgumentCaptor.forClass(Runnable.class);
        service.subscribe("job-timeout", List::of, emitter);

        verify(emitter).onTimeout(callback.capture());
        callback.getValue().run();

        assertThat(service.activeConnections()).isZero();
    }

    @Test
    void terminalEventIsSentBeforeTheStreamCompletes() throws Exception {
        JobEventStreamService service = new JobEventStreamService();
        SseEmitter emitter = mock(SseEmitter.class);
        service.subscribe("job-terminal", List::of, emitter);

        service.publish(event("job-terminal", 1, "COMPLETED"));

        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(emitter).complete();
        assertThat(service.activeConnections()).isZero();
    }

    @Test
    void cleansUpEveryEmitterOnBackendShutdown() {
        JobEventStreamService service = new JobEventStreamService();
        service.subscribe("job-one", List::of);
        service.subscribe("job-two", List::of);

        assertThat(service.activeConnections()).isEqualTo(2);
        service.heartbeat();
        service.shutdown();

        assertThat(service.activeConnections()).isZero();
    }

    @Test
    void removesEmitterWhenInitialReplayFails() {
        JobEventStreamService service = new JobEventStreamService();

        assertThatThrownBy(() -> service.subscribe("failed-job", () -> {
            throw new IllegalStateException("replay failed");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(service.activeConnections()).isZero();
    }

    private JobEventView event(String jobId, long sequence, String status) {
        return new JobEventView(
            Long.toString(sequence), jobId, 1L, null, "IDEA_INTAKE", "STATUS_CHANGED",
            status, "job.idea.status", null, null, sequence, "2026-08-05T00:00:00Z");
    }
}
