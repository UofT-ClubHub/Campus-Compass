"use client";

import { useState } from "react";
import { Modal, TextInput, Textarea, Button, Stack, Group, Select, Alert } from "@mantine/core";
import type { User } from "@/model/types";

interface UserSettingsModalProps {
  opened: boolean
  onClose: () => void
  user: User
  token?: string
  onUserUpdate: (updatedUser: User) => void
}

export function Profile({ opened, onClose, user, token, onUserUpdate}: UserSettingsModalProps) {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        campus: user.campus,
        bio: user.bio,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const campusOptions = [
        { value: 'UTSG', label: 'UTSG' },
        { value: 'UTSC', label: 'UTSC' },
        { value: 'UTM', label: 'UTM' }
    ];
    
    const handleCancel = () => {
        setFormData({
            name: user.name,
            email: user.email,
            campus: user.campus,
            bio: user.bio,
        });
        setError(null);
        setSuccess(false);
        onClose();  
    }

    const handleInput = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
        setError(null);
        setSuccess(false);
    }

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: user.id,
                    ...formData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            const updatedUser: User = await response.json();
            onUserUpdate(updatedUser);
            setSuccess(true);
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred while updating your profile.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={handleCancel}
            title="Profile Settings"
            size="xl"
            centered
            closeOnClickOutside={!loading}
            closeOnEscape={!loading}>
        
            <Stack gap="md">

                <TextInput 
                    label="Name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(event) => handleInput('name', event.currentTarget.value)}
                    required
                    disabled={loading}
                />

                <Select
                    label="Campus"
                    placeholder="Select your campus"
                    value={formData.campus}
                    onChange={(value) => handleInput("campus", value || "")}
                    data={campusOptions}
                    disabled={loading}
                    searchable
                />

                <TextInput 
                    label="Bio"
                    placeholder="Tell us about yourself"
                    value={formData.bio}
                    onChange={(event) => handleInput('bio', event.currentTarget.value)}
                    disabled={loading}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="outline" color="#1E3765" onClick={handleCancel} disabled={loading}>Cancel</Button>
                    <Button color="#1E3765" onClick={handleSave} loading={loading} disabled={loading}>Save Changes</Button>
                </Group>
            </Stack>
        </Modal>
    );
}