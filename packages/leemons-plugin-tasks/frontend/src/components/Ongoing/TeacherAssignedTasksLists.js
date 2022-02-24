import React, { useState, useEffect, useMemo } from 'react';
import { useApi, unflatten } from '@common';
import useTranslateLoader from '@multilanguage/useTranslateLoader';
import { getCentersWithToken } from '@users/session';
import { Table } from '@bubbles-ui/components';
import { prefixPN } from '../../helpers/prefixPN';
import listTeacherTasks from '../../request/instance/listTeacherTasks';

async function getTasks(userAgent, setTasks) {
  const response = await listTeacherTasks(userAgent, true);
  const assignedTasks = response.tasks.items.map((t) => {
    // eslint-disable-next-line no-param-reassign
    const task = t;
    task.students.count = t.students.count;
    task.group = '-';
    task.students.open = `${t.students.open} | ${Math.round(
      (t.students.open / t.students.count) * 100
    )}%`;
    task.students.ongoing = `${t.students.ongoing} | ${Math.round(
      (t.students.ongoing / t.students.count) * 100
    )}%`;
    task.students.completed = `${t.students.completed} | ${Math.round(
      (t.students.completed / t.students.count) * 100
    )}%`;

    return task;
  });

  setTasks((t) => [...t, ...assignedTasks]);

  return response;
}

export default function TeacherAssignedTasksLists() {
  const [, translations] = useTranslateLoader(prefixPN('teacher_assignments'));
  const [tableLabels, setTableLabels] = useState({});
  const [centers] = useApi(getCentersWithToken);
  const [tasks, setTasks] = useState([]);

  // EN: Parse the translations object
  // ES: Procesar el objeto de traducciones
  useEffect(() => {
    if (translations && translations.items) {
      const res = unflatten(translations.items);
      const data = res.plugins.tasks.teacher_assignments;

      // EN: Save your translations keys to use them in your component
      // ES: Guarda tus traducciones para usarlas en tu componente
      setTableLabels(data.table.headers);
    }
  }, [translations]);

  const columns = useMemo(
    () => [
      {
        Header: tableLabels?.group,
        accessor: 'group',
      },
      {
        Header: tableLabels?.task,
        accessor: 'task.name',
      },
      {
        Header: tableLabels?.deadline,
        accessor: 'deadline',
      },
      {
        Header: tableLabels?.students,
        accessor: 'students.count',
      },
      {
        Header: tableLabels?.status,
        accessor: 'status',
      },
      {
        Header: tableLabels?.open,
        accessor: 'students.open',
      },
      {
        Header: tableLabels?.ongoing,
        accessor: 'students.ongoing',
      },
      {
        Header: tableLabels?.completed,
        accessor: 'students.completed',
      },
      {
        Header: tableLabels?.actions,
        accessor: 'data.actions',
      },
    ],
    [tableLabels]
  );

  useEffect(() => {
    if (centers.length) {
      centers.forEach((center) => {
        getTasks(center.userAgentId, setTasks);
      });
    }
  }, [centers]);

  return <>{tasks.length && <Table columns={columns} data={tasks} />}</>;
}
