'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';

interface BikeMapping {
  bike_id: number;
  model_name: string;
  weight_percent: number;
  priority_order: number;
  is_active: boolean;
}

const EMPTY_OPTION = {
  option_text: '',
  option_desc: '',
  icon_name: '',
  metadata: {},
  bike_mappings: [] as BikeMapping[],
};

export default function QuizManagerPage() {
  const [bikes, setBikes] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [quizOptions, setQuizOptions] = useState<any[]>([]);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [newQuestion, setNewQuestion] = useState({ question_text: '', question_type: 'behavior', order_index: 0 });
  const [newOption, setNewOption] = useState<any>(EMPTY_OPTION);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [bRes, qRes] = await Promise.all([
      fetch('/api/admin/bikes'),
      fetch('/api/admin/quiz/questions'),
    ]);
    const b = await bRes.json();
    const q = await qRes.json();
    if (b.bikes) setBikes(b.bikes);
    if (q.questions) setQuizQuestions(q.questions);
  };

  const fetchOptions = async (questionId: number) => {
    const res = await fetch(`/api/admin/quiz/options?questionId=${questionId}`);
    const data = await res.json();
    if (data.options) setQuizOptions(data.options);
  };

  useEffect(() => {
    if (selectedQuestion) {
      fetchOptions(selectedQuestion.id);
    }
  }, [selectedQuestion]);

  const totalActiveWeight = (mappings: BikeMapping[]) =>
    mappings.filter((mapping) => mapping.is_active !== false).reduce((sum, mapping) => sum + Number(mapping.weight_percent || 0), 0);

  const resetOptionForm = () => {
    setEditingOption(null);
    setNewOption(EMPTY_OPTION);
    setFormError('');
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/quiz/questions', { method: 'POST', body: JSON.stringify(newQuestion) });
    setNewQuestion({ question_text: '', question_type: 'behavior', order_index: 0 });
    fetchData();
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Delete this question?')) {
      await fetch(`/api/admin/quiz/questions?id=${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const toggleBikeMapping = (bike: any) => {
    const existing = newOption.bike_mappings.find((mapping: BikeMapping) => mapping.bike_id === bike.id);
    if (existing) {
      setNewOption({
        ...newOption,
        bike_mappings: newOption.bike_mappings.filter((mapping: BikeMapping) => mapping.bike_id !== bike.id),
      });
      return;
    }

    setNewOption({
      ...newOption,
      bike_mappings: [
        ...newOption.bike_mappings,
        {
          bike_id: bike.id,
          model_name: bike.model_name,
          weight_percent: 0,
          priority_order: newOption.bike_mappings.length + 1,
          is_active: true,
        },
      ],
    });
  };

  const updateMapping = (bikeId: number, patch: Partial<BikeMapping>) => {
    setNewOption({
      ...newOption,
      bike_mappings: newOption.bike_mappings.map((mapping: BikeMapping) =>
        mapping.bike_id === bikeId ? { ...mapping, ...patch } : mapping
      ),
    });
  };

  const normalizeMappings = (mappings: BikeMapping[]) =>
    mappings.map((mapping, index) => ({
      bike_id: Number(mapping.bike_id),
      weight_percent: Number(mapping.weight_percent || 0),
      priority_order: Number(mapping.priority_order || index + 1),
      is_active: mapping.is_active !== false,
    }));

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      ...newOption,
      id: editingOption?.id,
      question_id: selectedQuestion.id,
      bike_mappings: normalizeMappings(newOption.bike_mappings),
    };

    if (selectedQuestion.question_type === 'behavior') {
      if (!payload.bike_mappings.length) {
        setFormError('Select at least one bike for this behavior.');
        return;
      }

      if (totalActiveWeight(newOption.bike_mappings) !== 100) {
        setFormError('Active bike weights must add up to 100%.');
        return;
      }
    }

    const res = await fetch('/api/admin/quiz/options', {
      method: editingOption ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || 'Failed to save option.');
      return;
    }

    resetOptionForm();
    fetchOptions(selectedQuestion.id);
  };

  const handleDeleteOption = async (id: string) => {
    if (confirm('Delete this option?')) {
      await fetch(`/api/admin/quiz/options?id=${id}`, { method: 'DELETE' });
      fetchOptions(selectedQuestion.id);
    }
  };

  const startEditingOption = (option: any) => {
    setEditingOption(option);
    setNewOption({
      option_text: option.option_text,
      option_desc: option.option_desc,
      icon_name: option.icon_name,
      metadata: typeof option.metadata === 'string' ? JSON.parse(option.metadata || '{}') : (option.metadata || {}),
      bike_mappings: (option.bike_mappings || []).map((mapping: any, index: number) => ({
        bike_id: mapping.bike_id,
        model_name: mapping.model_name,
        weight_percent: Number(mapping.weight_percent || 0),
        priority_order: Number(mapping.priority_order || index + 1),
        is_active: mapping.is_active !== false && mapping.is_active !== 0,
      })),
    });
    setFormError('');
  };

  const Icons = {
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
    Back: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  };

  return (
    <div className="fade-in">
      {!selectedQuestion ? (
        <>
          <div className={styles.header}><h1>Quiz Manager</h1></div>
          <div className={styles.card}>
            <h2 style={{ marginBottom: '20px' }}>Create Quiz Question</h2>
            <form onSubmit={handleAddQuestion} className={styles.formGrid}>
              <input placeholder="Question Text" value={newQuestion.question_text} onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })} className={styles.input} required />
              <select value={newQuestion.question_type} onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as any })} className={styles.select} required>
                <option value="behavior">Behavior (Bike priority)</option>
                <option value="destination">Destination (Scene)</option>
                <option value="aspiration">Aspiration (Color)</option>
              </select>
              <input type="number" placeholder="Display Order" value={newQuestion.order_index} onChange={(e) => setNewQuestion({ ...newQuestion, order_index: parseInt(e.target.value) || 0 })} className={styles.input} />
              <button type="submit" className={styles.primaryBtn}><Icons.Plus /> Add Question</button>
            </form>
          </div>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead><tr><th>Order</th><th>Question</th><th>Type</th><th>Actions</th></tr></thead>
              <tbody>
                {quizQuestions.map((q) => (
                  <tr key={q.id}>
                    <td style={{ width: '60px', color: '#007aff', fontWeight: 800 }}>{q.order_index}</td>
                    <td style={{ fontWeight: 500 }}>{q.question_text}</td>
                    <td><span className={styles.badge} style={{ background: q.question_type === 'behavior' ? 'rgba(0, 122, 255, 0.2)' : q.question_type === 'destination' ? 'rgba(0, 255, 122, 0.1)' : 'rgba(255, 122, 0, 0.1)', color: q.question_type === 'behavior' ? '#007aff' : q.question_type === 'destination' ? '#00ff7a' : '#ff7a00' }}>{q.question_type}</span></td>
                    <td>
                      <button onClick={() => setSelectedQuestion(q)} className={styles.editBtn}>Manage Options</button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className={styles.dangerBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <button onClick={() => { setSelectedQuestion(null); setQuizOptions([]); resetOptionForm(); }} className={styles.backBtn}><Icons.Back /> Back to Questions</button>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px' }}>{selectedQuestion.question_text}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', fontWeight: 700, marginTop: '4px' }}>Type: {selectedQuestion.question_type}</p>
          </div>
          <div className={styles.card}>
            <h3 style={{ marginBottom: '24px' }}>{editingOption ? 'Edit Option' : 'Create New Option'}</h3>
            <form onSubmit={handleAddOption} className={styles.formGrid}>
              <input placeholder="Option Title" value={newOption.option_text} onChange={(e) => setNewOption({ ...newOption, option_text: e.target.value })} className={styles.input} required />
              <input placeholder="Short Description" value={newOption.option_desc} onChange={(e) => setNewOption({ ...newOption, option_desc: e.target.value })} className={styles.input} />
              <input placeholder="Icon Name" value={newOption.icon_name} onChange={(e) => setNewOption({ ...newOption, icon_name: e.target.value })} className={styles.input} />

              {selectedQuestion.question_type === 'behavior' && (
                <>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className={styles.statLabel} style={{ marginBottom: '12px', display: 'block' }}>Select Bikes</label>
                    <div className={styles.bikeGrid}>
                      {bikes.map((bike) => (
                        <div
                          key={bike.id}
                          className={`${styles.bikeItem} ${newOption.bike_mappings.some((mapping: BikeMapping) => mapping.bike_id === bike.id) ? styles.selected : ''}`}
                          onClick={() => toggleBikeMapping(bike)}
                        >
                          <div className={styles.checkbox}><Icons.Check /></div>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{bike.model_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {newOption.bike_mappings.length > 0 && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label className={styles.statLabel}>Bike Priority and Weight</label>
                        <span style={{ color: totalActiveWeight(newOption.bike_mappings) === 100 ? '#00ff7a' : '#ffb020', fontSize: '12px', fontWeight: 700 }}>
                          Active Weight Total: {totalActiveWeight(newOption.bike_mappings)}%
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {newOption.bike_mappings
                          .slice()
                          .sort((a: BikeMapping, b: BikeMapping) => a.priority_order - b.priority_order)
                          .map((mapping: BikeMapping) => (
                            <div key={mapping.bike_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 120px 120px 90px', gap: '12px', alignItems: 'center' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600 }}>{mapping.model_name}</div>
                              <input type="number" min="0" max="100" className={styles.input} value={mapping.weight_percent} onChange={(e) => updateMapping(mapping.bike_id, { weight_percent: parseInt(e.target.value) || 0 })} placeholder="Weight %" />
                              <input type="number" min="1" className={styles.input} value={mapping.priority_order} onChange={(e) => updateMapping(mapping.bike_id, { priority_order: parseInt(e.target.value) || 1 })} placeholder="Priority" />
                              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                                <input type="checkbox" checked={mapping.is_active !== false} onChange={(e) => updateMapping(mapping.bike_id, { is_active: e.target.checked })} />
                                Active
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedQuestion.question_type === 'destination' && (
                <>
                  <input placeholder="Personality Signal" value={newOption.metadata?.personality || ''} onChange={(e) => setNewOption({ ...newOption, metadata: { ...newOption.metadata, personality: e.target.value } })} className={styles.input} />
                  <input placeholder="AI Scene Description" value={newOption.metadata?.scene || ''} onChange={(e) => setNewOption({ ...newOption, metadata: { ...newOption.metadata, scene: e.target.value } })} className={styles.input} />
                </>
              )}

              {selectedQuestion.question_type === 'aspiration' && (
                <input placeholder="Target Bike Color" value={newOption.metadata?.color || ''} onChange={(e) => setNewOption({ ...newOption, metadata: { ...newOption.metadata, color: e.target.value } })} className={styles.input} style={{ gridColumn: 'span 2' }} />
              )}

              {formError && (
                <div style={{ gridColumn: 'span 2', background: 'rgba(255, 77, 77, 0.1)', color: '#ff8080', borderRadius: '10px', padding: '12px 14px', fontSize: '13px' }}>
                  {formError}
                </div>
              )}

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button type="submit" className={styles.primaryBtn}>{editingOption ? 'Update Option' : 'Create Option'}</button>
                {editingOption && <button type="button" onClick={resetOptionForm} className={styles.secondaryBtn}>Cancel</button>}
              </div>
            </form>
          </div>
          <div className={styles.card}>
            <table className={styles.table}>
              <thead><tr><th>Title</th><th>Metadata / Logic</th><th>Actions</th></tr></thead>
              <tbody>
                {quizOptions.map((option) => (
                  <tr key={option.id}>
                    <td style={{ fontWeight: 600 }}>{option.option_text}</td>
                    <td style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      {selectedQuestion.question_type === 'behavior'
                        ? (option.bike_mappings || []).map((mapping: any) => `${mapping.model_name} (${mapping.weight_percent}%)`).join(', ') || 'None'
                        : selectedQuestion.question_type === 'destination'
                          ? `Scene: ${(typeof option.metadata === 'string' ? JSON.parse(option.metadata || '{}') : option.metadata || {}).scene || 'N/A'}`
                          : `Color: ${(typeof option.metadata === 'string' ? JSON.parse(option.metadata || '{}') : option.metadata || {}).color || 'N/A'}`}
                    </td>
                    <td>
                      <button onClick={() => startEditingOption(option)} className={styles.editBtn}>Edit</button>
                      <button onClick={() => handleDeleteOption(option.id)} className={styles.dangerBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
