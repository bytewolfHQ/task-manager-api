<?php

namespace App\Controller;

use App\Entity\Task;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/tasks', name: 'api_tasks_')]
final class TaskController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, max(1, (int) $request->query->get('limit', 10)));
        $offset = ($page - 1) * $limit;

        // Filters
        $status = $request->query->get('status');
        $priority = $request->query->get('priority');

        $queryBuilder = $this->entityManager->getRepository(Task::class)
            ->createQueryBuilder('t')
            ->where('t.owner = :user')
            ->setParameter('user', $user)
            ->orderBy('t.createdAt', 'DESC');

        // Apply filters
        if ($status) {
            $queryBuilder->andWhere('t.status = :status')
                ->setParameter('status', $status);
        }

        if ($priority) {
            $queryBuilder->andWhere('t.priority = :priority')
                ->setParameter('priority', $priority);
        }

        // Get total count for pagination (fix for PostgreSQL)
        $totalQuery = $this->entityManager->getRepository(Task::class)
            ->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->where('t.owner = :user')
            ->setParameter('user', $user);

        // Apply same filters to count query
        if ($status) {
            $totalQuery->andWhere('t.status = :status')
                ->setParameter('status', $status);
        }

        if ($priority) {
            $totalQuery->andWhere('t.priority = :priority')
                ->setParameter('priority', $priority);
        }

        $total = $totalQuery->getQuery()->getSingleScalarResult();

        // Get paginated results
        $tasks = $queryBuilder
            ->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        $taskData = array_map([$this, 'taskToArray'], $tasks);

        return new JsonResponse([
            'data' => $taskData,
            'meta' => [
                'total' => (int) $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => (int) ceil($total / $limit)
            ]
        ]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $task = $this->entityManager->getRepository(Task::class)->find($id);

        if (!$task) {
            return new JsonResponse(['error' => 'Task not found'], 404);
        }

        // Security: Only owner can see task
        if ($task->getOwner() !== $user) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        return new JsonResponse(['data' => $this->taskToArray($task)]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(#[CurrentUser] User $user, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        // Required fields
        if (!isset($data['title']) || !isset($data['status']) || !isset($data['priority'])) {
            return new JsonResponse([
                'error' => 'Missing required fields: title, status, priority'
            ], 400);
        }

        $task = new Task();
        $task->setTitle($data['title']);
        $task->setDescription($data['description'] ?? null);
        $task->setStatus($data['status']);
        $task->setPriority($data['priority']);
        $task->setOwner($user);
        $task->setCreatedAt(new \DateTimeImmutable());

        // Handle dueDate
        if (isset($data['dueDate']) && $data['dueDate']) {
            try {
                $dueDate = new \DateTimeImmutable($data['dueDate']);
                $task->setDueDate($dueDate);
            } catch (\Exception $e) {
                return new JsonResponse([
                    'error' => 'Invalid dueDate format. Use ISO 8601 format (e.g., 2024-12-31T23:59:59)'
                ], 400);
            }
        }

        // Validate
        $errors = $this->validator->validate($task);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse([
                'error' => 'Validation failed',
                'details' => $errorMessages
            ], 400);
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Task created successfully',
            'data' => $this->taskToArray($task)
        ], 201);
    }

    #[Route('/{id}', name: 'update', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(#[CurrentUser] User $user, int $id, Request $request): JsonResponse
    {
        $task = $this->entityManager->getRepository(Task::class)->find($id);

        if (!$task) {
            return new JsonResponse(['error' => 'Task not found'], 404);
        }

        // Security: Only owner can update task
        if ($task->getOwner() !== $user) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse(['error' => 'Invalid JSON'], 400);
        }

        // Update fields if provided
        if (isset($data['title'])) {
            $task->setTitle($data['title']);
        }

        if (isset($data['description'])) {
            $task->setDescription($data['description']);
        }

        if (isset($data['status'])) {
            $task->setStatus($data['status']);
        }

        if (isset($data['priority'])) {
            $task->setPriority($data['priority']);
        }

        if (isset($data['dueDate'])) {
            if ($data['dueDate']) {
                try {
                    $dueDate = new \DateTimeImmutable($data['dueDate']);
                    $task->setDueDate($dueDate);
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'error' => 'Invalid dueDate format. Use ISO 8601 format (e.g., 2024-12-31T23:59:59)'
                    ], 400);
                }
            } else {
                $task->setDueDate(null);
            }
        }

        $task->setUpdatedAt(new \DateTimeImmutable());

        // Validate
        $errors = $this->validator->validate($task);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse([
                'error' => 'Validation failed',
                'details' => $errorMessages
            ], 400);
        }

        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Task updated successfully',
            'data' => $this->taskToArray($task)
        ]);
    }

    #[Route('/{id}', name: 'delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(#[CurrentUser] User $user, int $id): JsonResponse
    {
        $task = $this->entityManager->getRepository(Task::class)->find($id);

        if (!$task) {
            return new JsonResponse(['error' => 'Task not found'], 404);
        }

        // Security: Only owner can delete task
        if ($task->getOwner() !== $user) {
            return new JsonResponse(['error' => 'Access denied'], 403);
        }

        $this->entityManager->remove($task);
        $this->entityManager->flush();

        return new JsonResponse([
            'message' => 'Task deleted successfully'
        ]);
    }

    private function taskToArray(Task $task): array
    {
        return [
            'id' => $task->getId(),
            'title' => $task->getTitle(),
            'description' => $task->getDescription(),
            'status' => $task->getStatus(),
            'priority' => $task->getPriority(),
            'dueDate' => $task->getDueDate()?->format('Y-m-d\TH:i:s'),
            'createdAt' => $task->getCreatedAt()->format('Y-m-d\TH:i:s'),
            'updatedAt' => $task->getUpdatedAt()?->format('Y-m-d\TH:i:s'),
            'owner' => [
                'id' => $task->getOwner()->getId(),
                'username' => $task->getOwner()->getUsername()
            ]
        ];
    }
}
