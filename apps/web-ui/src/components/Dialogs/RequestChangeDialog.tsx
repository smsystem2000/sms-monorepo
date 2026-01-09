import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Alert,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateRequest } from '../../queries/Request';
import type { CreateRequestPayload } from '../../types';

interface RequestChangeDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    userId: string;
    userName: string;
    userType: "teacher" | "student" | "parent" | "sch_admin";
    fieldType?: "email_change" | "phone_change" | "general";
    currentValue?: string;
}

const RequestChangeDialog: React.FC<RequestChangeDialogProps> = ({
    open,
    onClose,
    schoolId,
    userId,
    userName,
    userType,
    fieldType = "general",
    currentValue = "",
}) => {
    const [requestType, setRequestType] = useState<"email_change" | "phone_change" | "general">(fieldType);
    const [newValue, setNewValue] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateRequest(schoolId);

    // Sync requestType with fieldType prop when dialog opens
    useEffect(() => {
        if (open) {
            setRequestType(fieldType);
        }
    }, [open, fieldType]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!message.trim()) newErrors.message = "Message is required";
        if (requestType !== "general" && !newValue.trim()) {
            newErrors.newValue = "New value is required";
        }
        if (requestType === "email_change" && newValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
            newErrors.newValue = "Invalid email format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload: CreateRequestPayload = {
            userType,
            userId,
            userName,
            requestType,
            oldValue: currentValue,
            newValue: requestType !== "general" ? newValue : undefined,
            message,
        };

        try {
            await createMutation.mutateAsync(payload);
            handleClose();
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        setRequestType(fieldType);
        setNewValue("");
        setMessage("");
        setErrors({});
        createMutation.reset();
        onClose();
    };

    const getTitle = () => {
        switch (requestType) {
            case "email_change": return "Request Email Change";
            case "phone_change": return "Request Phone Change";
            default: return "Submit Request";
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {getTitle()}
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {createMutation.isError && (
                        <Alert severity="error">
                            {(createMutation.error as { message?: string })?.message || 'Failed to submit request'}
                        </Alert>
                    )}

                    <FormControl fullWidth>
                        <InputLabel>Request Type</InputLabel>
                        <Select
                            value={requestType}
                            label="Request Type"
                            onChange={(e) => setRequestType(e.target.value as typeof requestType)}
                        >
                            <MenuItem value="email_change">Email Change</MenuItem>
                            <MenuItem value="phone_change">Phone Change</MenuItem>
                            <MenuItem value="general">General Query</MenuItem>
                        </Select>
                    </FormControl>

                    {requestType !== "general" && currentValue && (
                        <TextField
                            label="Current Value"
                            value={currentValue}
                            disabled
                            fullWidth
                        />
                    )}

                    {requestType !== "general" && (
                        <TextField
                            label={requestType === "email_change" ? "New Email" : "New Phone"}
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            error={!!errors.newValue}
                            helperText={errors.newValue}
                            required
                            fullWidth
                        />
                    )}

                    <TextField
                        label="Message / Reason"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        error={!!errors.message}
                        helperText={errors.message}
                        required
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Please explain why you need this change..."
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={createMutation.isPending}
                        startIcon={createMutation.isPending ? <CircularProgress size={20} /> : null}
                    >
                        {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default RequestChangeDialog;
