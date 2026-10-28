package main.java.com.aether.web;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ExperienceController {

    private final ConcurrentLinkedQueue<Inquiry> inquiries =
            new ConcurrentLinkedQueue<>();

    public record Artifact(
            String number,
            String title,
            String category,
            String description
    ) {}

    public record ContactRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(max = 2000) String message
    ) {}

    public record Inquiry(
            String id,
            String name,
            String email,
            String message,
            Instant createdAt
    ) {}

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/experience")
    public Map<String, Object> experience() {
        return Map.of(
            "name", "AETHER",
            "edition", "01 / INFINITE FORMS",
            "artifacts", List.of(
                new Artifact(
                    "01",
                    "The Origin",
                    "GENERATIVE FORM",
                    "A structure born from mathematical possibility."
                ),
                new Artifact(
                    "02",
                    "The Signal",
                    "LUMINOUS SYSTEM",
                    "Light becomes an architecture of motion."
                ),
                new Artifact(
                    "03",
                    "The Infinite",
                    "SPATIAL STUDY",
                    "A horizon without a fixed boundary."
                )
            )
        );
    }

    @PostMapping("/contact")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> contact(
            @Valid @RequestBody ContactRequest request
    ) {
        String id = UUID.randomUUID().toString();

        inquiries.add(
            new Inquiry(
                id,
                request.name(),
                request.email(),
                request.message(),
                Instant.now()
            )
        );

        return Map.of(
            "status", "received",
            "id", id,
            "notice", "Stored in memory; no email sent."
        );
    }
}
