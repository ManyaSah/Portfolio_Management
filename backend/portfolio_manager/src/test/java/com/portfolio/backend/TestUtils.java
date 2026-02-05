package com.portfolio.backend;

import java.lang.reflect.Field;

public class TestUtils {
    
    public static void setId(Object entity, Long id) {
        try {
            Field idField = entity.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            // Ignore reflection errors
        }
    }
}
