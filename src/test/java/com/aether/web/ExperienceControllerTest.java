package test.java.com.aether.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ExperienceControllerTest {

    @Autowired
    MockMvc mvc;

    @Test
    void experience() throws Exception {
        mvc.perform(get("/api/experience"))
            .andExpect(status().isOk())
            .andExpect(
                jsonPath("$.artifacts.length()").value(3)
            );
    }

    @Test
    void validContact() throws Exception {
        mvc.perform(
            post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "Ada",
                        "email": "ada@example.com",
                        "message": "Hello"
                    }
                    """)
        )
        .andExpect(status().isCreated())
        .andExpect(
            jsonPath("$.status").value("received")
        );
    }

    @Test
    void invalidContact() throws Exception {
        mvc.perform(
            post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "name": "",
                        "email": "bad",
                        "message": ""
                    }
                    """)
        )
        .andExpect(status().isBadRequest());
    }
}
