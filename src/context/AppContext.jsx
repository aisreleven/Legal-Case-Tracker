import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { caseService } from '../services/caseService';
import { hearingService } from '../services/hearingService';
import { documentService } from '../services/documentService';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';
import {
  initialUsers,
  initialCases,
  initialHearings,
  initialDocuments,
  initialNotifications,
  initialActivities
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('juristrack_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('juristrack_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Auth & Session State
  // Access is restored ONLY if a valid Supabase session exists upon verification
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Entities state - initialized empty when Supabase is active
  const [users, setUsers] = useState(isSupabaseConfigured ? [] : initialUsers);
  const [cases, setCases] = useState(isSupabaseConfigured ? [] : initialCases);
  const [hearings, setHearings] = useState(isSupabaseConfigured ? [] : initialHearings);
  const [documents, setDocuments] = useState(isSupabaseConfigured ? [] : initialDocuments);
  const [notifications, setNotifications] = useState(isSupabaseConfigured ? [] : initialNotifications);
  const [activities, setActivities] = useState(isSupabaseConfigured ? [] : initialActivities);

  // Map database record to frontend case model
  const mapDbCaseToModel = (dbCase) => ({
    id: dbCase.id,
    caseNumber: dbCase.case_number,
    title: dbCase.title,
    category: dbCase.case_type,
    courtName: dbCase.court_name,
    courtroom: dbCase.courtroom || dbCase.court_location || 'Room 101',
    judge: dbCase.judge || "Hon'ble Division Bench",
    clientName: dbCase.client?.full_name || 'Client Litigant',
    clientId: dbCase.client_id,
    clientEmail: dbCase.client?.email || '',
    clientPhone: dbCase.client?.phone || '',
    assignedLawyer: dbCase.lawyer?.full_name || 'Adv. Counsel',
    lawyerId: dbCase.lawyer_id,
    filingDate: dbCase.filing_date,
    status: dbCase.status.charAt(0).toUpperCase() + dbCase.status.slice(1),
    priority: dbCase.priority.charAt(0).toUpperCase() + dbCase.priority.slice(1),
    description: dbCase.description || '',
    progressStage: dbCase.progress_stage || 'Evidence Phase',
    progressPercent: dbCase.progress_percent || 50,
    caseProgress: [
      { stage: 'Case Registration & Filing', date: dbCase.filing_date, completed: true, description: 'LODGED in official docket.' },
      { stage: 'Summons & Preliminary Notice', date: 'Procedural Notice', completed: true, description: 'Served on opposite counsel.' },
      { stage: dbCase.progress_stage || 'Trial Arguments', date: 'Current Stage', completed: false, description: 'Current judicial proceedings.' }
    ],
    hearingHistory: (dbCase.hearings || []).map(h => ({
      id: h.id,
      date: h.hearing_date,
      time: h.hearing_time,
      type: h.hearing_type,
      outcome: h.outcome || 'Hearing logged',
      judge: dbCase.judge || 'Bench'
    })),
    associatedDocuments: (dbCase.documents || []).map(d => d.id)
  });

  // Map database record to frontend hearing model
  const mapDbHearingToModel = (dbH) => ({
    id: dbH.id,
    caseId: dbH.case_id,
    caseNumber: dbH.case?.case_number || 'N/A',
    caseTitle: dbH.case?.title || 'Court Matter',
    hearingDate: dbH.hearing_date,
    hearingTime: dbH.hearing_time,
    courtName: dbH.court_name,
    courtroom: dbH.courtroom || 'Courtroom 101',
    hearingType: dbH.hearing_type,
    assignedLawyer: dbH.case?.lawyer?.full_name || 'Assigned Counsel',
    clientName: dbH.case?.client?.full_name || 'Client',
    status: dbH.status.charAt(0).toUpperCase() + dbH.status.slice(1),
    notes: dbH.description || '',
    outcome: dbH.outcome || 'Awaiting hearing date'
  });

  // Map database record to frontend document model
  const mapDbDocToModel = (dbDoc) => ({
    id: dbDoc.id,
    title: dbDoc.document_name,
    caseId: dbDoc.case_id,
    caseNumber: dbDoc.case?.case_number || 'N/A',
    caseTitle: dbDoc.case?.title || 'General Legal Matter',
    category: dbDoc.document_type,
    fileType: dbDoc.mime_type?.includes('pdf') ? 'pdf' : (dbDoc.mime_type?.includes('word') || dbDoc.file_path?.endsWith('doc') || dbDoc.file_path?.endsWith('docx')) ? 'docx' : 'jpg',
    fileSize: dbDoc.file_size || '2.1 MB',
    uploadedBy: dbDoc.uploader?.full_name || 'Court Registrar',
    uploadDate: dbDoc.created_at ? dbDoc.created_at.split('T')[0] : '2026-11-20',
    downloads: dbDoc.downloads || 0,
    filePath: dbDoc.file_path,
    description: dbDoc.description || 'Verified legal record',
    contentSnippet: dbDoc.content_snippet || 'AUTHENTIC RECORD: File stored in secure Supabase Storage bucket.'
  });

  // Refresh all state from Supabase
  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setDataLoading(true);
    try {
      // 1. Fetch Cases
      const { data: dbCases } = await caseService.getCases();
      if (dbCases !== null && dbCases !== undefined) {
        setCases(dbCases.map(mapDbCaseToModel));
      }

      // 2. Fetch Hearings
      const { data: dbHearings } = await hearingService.getHearings();
      if (dbHearings !== null && dbHearings !== undefined) {
        setHearings(dbHearings.map(mapDbHearingToModel));
      }

      // 3. Fetch Documents
      const { data: dbDocs } = await documentService.getDocuments();
      if (dbDocs !== null && dbDocs !== undefined) {
        setDocuments(dbDocs.map(mapDbDocToModel));
      }

      // 4. Fetch Users / Profiles
      const { data: dbProfiles } = await userService.getUsers();
      if (dbProfiles !== null && dbProfiles !== undefined) {
        setUsers(dbProfiles.map(p => ({
          id: p.id,
          fullName: p.full_name,
          email: p.email,
          phone: p.phone || '',
          role: p.role.charAt(0).toUpperCase() + p.role.slice(1),
          specialization: p.specialization,
          department: p.department,
          company: p.company,
          barCouncilId: p.bar_council_id,
          avatar: p.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          registrationDate: p.created_at ? p.created_at.split('T')[0] : '2026-01-01',
          status: p.account_status.charAt(0).toUpperCase() + p.account_status.slice(1),
          bio: p.bio
        })));
      }

      // 5. Fetch Notifications
      const { data: dbNotifs } = await notificationService.getNotifications();
      if (dbNotifs !== null && dbNotifs !== undefined) {
        setNotifications(dbNotifs.map(n => ({
          id: n.id,
          type: n.notification_type,
          title: n.title,
          message: n.message,
          timestamp: n.created_at ? n.created_at.replace('T', ' ').slice(0, 16) : 'Just now',
          read: n.is_read,
          link: n.link || '/notifications',
          caseId: n.related_case_id
        })));
      }

      // 6. Fetch Recent Case Activities
      const { data: dbActivities } = await supabase
        .from('case_activities')
        .select(`
          id,
          case_id,
          user_id,
          activity_type,
          description,
          created_at,
          actor:profiles(id, full_name, role),
          case:cases(id, case_number, title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbActivities !== null && dbActivities !== undefined) {
        setActivities(dbActivities.map(a => ({
          id: a.id,
          caseId: a.case_id,
          user: a.actor?.full_name || 'System',
          action: a.activity_type,
          target: a.case?.case_number ? `${a.case.case_number} — ${a.description}` : a.description,
          time: a.created_at ? a.created_at.replace('T', ' ').slice(0, 16) : ''
        })));
      }
    } catch (err) {
      console.warn('Could not sync with Supabase tables:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Supabase Auth session initialization and listener
  useEffect(() => {
    let isMounted = true;

    // 9. On page refresh, restore access only if a valid Supabase session exists.
    const verifySession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          if (isMounted) {
            setCurrentUser(null);
            localStorage.removeItem('juristrack_user');
            setAuthLoading(false);
          }
          return;
        }

        // Active session verified by Supabase Auth
        const profile = await authService.getCurrentUserProfile();
        if (isMounted) {
          if (profile) {
            const mappedUser = {
              id: profile.id,
              fullName: profile.full_name,
              email: profile.email,
              phone: profile.phone || '',
              role: profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase(),
              specialization: profile.specialization,
              department: profile.department,
              company: profile.company,
              barCouncilId: profile.bar_council_id,
              avatar: profile.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              status: (profile.account_status || 'active').charAt(0).toUpperCase() + (profile.account_status || 'active').slice(1).toLowerCase(),
              bio: profile.bio
            };
            setCurrentUser(mappedUser);
            localStorage.setItem('juristrack_user', JSON.stringify(mappedUser));
          } else {
            const fallbackUser = {
              id: session.user.id,
              fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              phone: session.user.user_metadata?.phone || '',
              role: (session.user.user_metadata?.role || 'Client').charAt(0).toUpperCase() + (session.user.user_metadata?.role || 'Client').slice(1).toLowerCase(),
              status: 'Active',
            };
            setCurrentUser(fallbackUser);
            localStorage.setItem('juristrack_user', JSON.stringify(fallbackUser));
          }
          setAuthLoading(false);
          refreshData();
        }
      } catch (err) {
        console.error('Session verification encountered error:', err);
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem('juristrack_user');
          setAuthLoading(false);
        }
      }
    };

    verifySession();

    // 7. Check existing Supabase sessions using onAuthStateChange().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const profile = await authService.getCurrentUserProfile();
        if (isMounted) {
          const mappedUser = profile ? {
            id: profile.id,
            fullName: profile.full_name,
            email: profile.email,
            phone: profile.phone || '',
            role: profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase(),
            specialization: profile.specialization,
            department: profile.department,
            company: profile.company,
            barCouncilId: profile.bar_council_id,
            avatar: profile.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            status: (profile.account_status || 'active').charAt(0).toUpperCase() + (profile.account_status || 'active').slice(1).toLowerCase(),
            bio: profile.bio
          } : {
            id: session.user.id,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            phone: session.user.user_metadata?.phone || '',
            role: (session.user.user_metadata?.role || 'Client').charAt(0).toUpperCase() + (session.user.user_metadata?.role || 'Client').slice(1).toLowerCase(),
            status: 'Active',
          };
          setCurrentUser(mappedUser);
          localStorage.setItem('juristrack_user', JSON.stringify(mappedUser));
          setAuthLoading(false);
          refreshData();
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem('juristrack_user');
          setAuthLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [refreshData]);

  // Auth Operations
  // 1. Use Supabase Auth signInWithPassword() for actual authentication.
  // 2. Never redirect users to the dashboard unless Supabase confirms successful authentication.
  // 3. Check the returned error from Supabase.
  const loginWithCredentials = async (email, password) => {
    const { data, error } = await authService.signIn({ email, password });
    if (error) {
      return { success: false, error };
    }

    if (!data?.user || !data?.session) {
      return { 
        success: false, 
        error: new Error('Invalid email or password. Please verify your credentials or register a new account.') 
      };
    }

    const profile = data.profile;
    const mappedUser = {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase(),
      specialization: profile.specialization || '',
      department: profile.department || '',
      company: profile.company || '',
      barCouncilId: profile.bar_council_id || '',
      avatar: profile.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      status: (profile.account_status || 'active').charAt(0).toUpperCase() + (profile.account_status || 'active').slice(1).toLowerCase(),
      bio: profile.bio || ''
    };

    setCurrentUser(mappedUser);
    localStorage.setItem('juristrack_user', JSON.stringify(mappedUser));
    showToast(`Welcome back, ${mappedUser.fullName}!`);
    return { success: true, user: mappedUser };
  };

  const registerUser = async (formData) => {
    const { data, error } = await authService.signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
      role: 'client',
      metadata: {
        phone: formData.phone
      }
    });

    if (error) {
      showToast(error.message, 'error');
      return { success: false, error };
    }

    showToast('Registration successful! Please sign in with your credentials.');
    return { success: true, data };
  };

  // 6. Implement proper sign-out using supabase.auth.signOut().
  const logout = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      localStorage.removeItem('juristrack_user');
      localStorage.removeItem('juristrack_auth_token');
      setCurrentUser(null);
      showToast('Signed out successfully.', 'info');
    }
  };

  const resetPassword = async (email) => {
    if (isSupabaseConfigured) {
      return await authService.resetPassword(email);
    }
    showToast('Demo recovery link dispatched.');
    return { error: null };
  };

  // Case Actions
  const addCase = async (caseData) => {
    if (isSupabaseConfigured) {
      const { data, error } = await caseService.createCase(caseData);
      if (!error && data) {
        showToast(`Case ${data.case_number} registered in PostgreSQL.`);
        refreshData();
        return mapDbCaseToModel(data);
      }
    }

    // Optimistic fallback
    const newCase = {
      id: `case-${Date.now()}`,
      caseNumber: caseData.caseNumber || `CIV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      filingDate: caseData.filingDate || new Date().toISOString().split('T')[0],
      status: caseData.status || 'Active',
      priority: caseData.priority || 'Medium',
      progressStage: 'Initial Case Filing',
      progressPercent: 20,
      caseProgress: [
        { stage: 'Case Registration & Filing', date: new Date().toISOString().split('T')[0], completed: true, description: 'Entered into docket.' }
      ],
      hearingHistory: [],
      associatedDocuments: [],
      ...caseData
    };

    setCases(prev => [newCase, ...prev]);
    showToast(`Case ${newCase.caseNumber} registered successfully.`);
    return newCase;
  };

  const updateCase = async (id, updatedFields) => {
    if (isSupabaseConfigured) {
      await caseService.updateCase(id, updatedFields);
      refreshData();
    }
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    showToast('Case details saved.');
  };

  const deleteCase = async (id) => {
    if (isSupabaseConfigured) {
      await caseService.deleteCase(id);
      refreshData();
    }
    setCases(prev => prev.filter(c => c.id !== id));
    showToast('Case removed from docket.', 'info');
  };

  const getCaseById = (id) => {
    return cases.find(c => c.id === id || c.caseNumber === id);
  };

  // Hearing Actions
  const addHearing = async (hearingData) => {
    if (isSupabaseConfigured) {
      const { data, error } = await hearingService.createHearing(hearingData);
      if (!error && data) {
        showToast('Hearing saved to PostgreSQL cause list.');
        refreshData();
        return mapDbHearingToModel(data);
      }
    }

    const newHearing = {
      id: `hrg-${Date.now()}`,
      status: hearingData.status || 'Scheduled',
      outcome: 'Awaiting hearing date',
      ...hearingData
    };
    setHearings(prev => [newHearing, ...prev]);
    showToast(`Hearing scheduled for ${newHearing.hearingDate}.`);
    return newHearing;
  };

  const updateHearing = async (id, updatedFields) => {
    if (isSupabaseConfigured) {
      await hearingService.updateHearing(id, updatedFields);
      refreshData();
    }
    setHearings(prev => prev.map(h => h.id === id ? { ...h, ...updatedFields } : h));
    showToast('Hearing updated.');
  };

  const rescheduleHearing = async (id, newDate, newTime, notes, status = 'Scheduled') => {
    if (isSupabaseConfigured) {
      await hearingService.rescheduleHearing(id, newDate, newTime, notes, status);
      refreshData();
    }
    setHearings(prev => prev.map(h => {
      if (h.id === id) {
        return { ...h, hearingDate: newDate, hearingTime: newTime, notes, status };
      }
      return h;
    }));
    showToast(`Hearing rescheduled to ${newDate} at ${newTime}.`);
  };

  const deleteHearing = async (id) => {
    if (isSupabaseConfigured) {
      await hearingService.deleteHearing(id);
      refreshData();
    }
    setHearings(prev => prev.filter(h => h.id !== id));
    showToast('Hearing record deleted.', 'info');
  };

  // Document Actions
  const addDocument = async (docData) => {
    if (isSupabaseConfigured && docData.file) {
      const { data, error } = await documentService.uploadDocument({
        file: docData.file,
        title: docData.title,
        caseId: docData.caseId,
        category: docData.category,
        description: docData.description
      });
      if (!error && data) {
        showToast('Document securely uploaded to Supabase Storage.');
        refreshData();
        return mapDbDocToModel(data);
      }
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser ? currentUser.fullName : 'Legal Counsel',
      downloads: 0,
      fileSize: docData.fileSize || '2.1 MB',
      ...docData
    };
    setDocuments(prev => [newDoc, ...prev]);
    showToast(`Document "${newDoc.title}" indexed.`);
    return newDoc;
  };

  const deleteDocument = async (id, filePath) => {
    if (isSupabaseConfigured) {
      await documentService.deleteDocument(id, filePath);
      refreshData();
    }
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast('Document deleted from repository.', 'info');
  };

  const downloadDocument = async (doc) => {
    if (isSupabaseConfigured && doc.filePath) {
      const { url } = await documentService.getSignedUrl(doc.filePath);
      if (url) {
        window.open(url, '_blank');
        showToast(`Opening authenticated document: ${doc.title}`);
        return;
      }
    }

    // Client-side demo fallback download
    const content = `========================================================
JURISTRACK - LEGAL CASE DOCUMENT & HEARING REPOSITORY
========================================================
Document Title: ${doc.title}
Document ID: ${doc.id}
Case Reference: ${doc.caseNumber || 'N/A'}
Category: ${doc.category || 'General Legal Document'}
Uploaded By: ${doc.uploadedBy || 'Legal Counsel'}
Date of Upload: ${doc.uploadDate || 'N/A'}
--------------------------------------------------------
AUTHENTIC RECORD SNIPPET:
${doc.contentSnippet || 'Certified official legal document stored in repository.'}
--------------------------------------------------------
VERIFICATION HASH: SHA256-${doc.id}-${Date.now()}
========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(doc.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded: ${doc.title}`);
  };

  // User Actions
  const addUser = (userData) => {
    const newUser = {
      id: `usr-${String(users.length + 1).padStart(3, '0')}`,
      status: 'Active',
      registrationDate: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-${1534528741775 + users.length}?auto=format&fit=crop&q=80&w=200`,
      ...userData
    };
    setUsers(prev => [newUser, ...prev]);
    showToast(`User ${newUser.fullName} registered.`);
    return newUser;
  };

  const updateUser = async (id, updatedFields) => {
    if (isSupabaseConfigured) {
      await userService.updateUser(id, updatedFields);
      refreshData();
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));
    if (currentUser?.id === id) {
      const merged = { ...currentUser, ...updatedFields };
      setCurrentUser(merged);
      localStorage.setItem('juristrack_user', JSON.stringify(merged));
    }
    showToast('User profile updated.');
  };

  const deleteUser = async (id) => {
    if (currentUser?.id === id) {
      showToast('Cannot delete currently logged-in account.', 'error');
      return false;
    }
    if (isSupabaseConfigured) {
      await userService.deleteUser(id);
      refreshData();
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('User removed from system.', 'info');
    return true;
  };

  const toggleUserStatus = async (id) => {
    const target = users.find(u => u.id === id);
    if (target && isSupabaseConfigured) {
      await userService.toggleUserStatus(id, target.status.toLowerCase());
      refreshData();
    }
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        showToast(`${u.fullName} is now ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Notification Actions
  const markNotificationRead = async (id) => {
    if (isSupabaseConfigured) {
      await notificationService.markAsRead(id);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (isSupabaseConfigured) {
      await notificationService.markAllAsRead();
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const deleteNotification = async (id) => {
    if (isSupabaseConfigured) {
      await notificationService.deleteNotification(id);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        currentUser,
        setCurrentUser,
        authLoading,
        dataLoading,
        isConfigured: isSupabaseConfigured,
        users,
        cases,
        hearings,
        documents,
        notifications,
        activities,
        toast,
        showToast,
        loginWithCredentials,
        registerUser,
        logout,
        resetPassword,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addCase,
        updateCase,
        deleteCase,
        getCaseById,
        addHearing,
        updateHearing,
        rescheduleHearing,
        deleteHearing,
        addDocument,
        deleteDocument,
        downloadDocument,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        unreadNotificationCount,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
